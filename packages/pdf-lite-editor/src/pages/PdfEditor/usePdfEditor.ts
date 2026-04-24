import React, { useEffect, useRef, useState } from 'react'
import type {
    EncryptionAlgorithm,
    ExtractedField,
    ExtractedGraphicsBlock,
    ExtractedTextBlock,
    FieldType,
    FontRef,
} from './types'
import { getSharedPdfWorkerClient } from './worker/pdfWorkerClient'

export function usePdfEditor() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pdfLoaded, setPdfLoaded] = useState(false)
    const [pageCount, setPageCount] = useState(0)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(1.0)
    const [activeView, setActiveView] = useState<'pdf' | 'text'>('pdf')
    const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([])
    const [extractedTextBlocks, setExtractedTextBlocks] = useState<
        ExtractedTextBlock[]
    >([])
    const [extractedGraphicsBlocks, setExtractedGraphicsBlocks] = useState<
        ExtractedGraphicsBlock[]
    >([])
    const [showAcroFormLayer, setShowAcroFormLayer] = useState<boolean>(true)
    const [showTextLayer, setShowTextLayer] = useState<boolean>(true)
    const [showGraphicsLayer, setShowGraphicsLayer] = useState<boolean>(false)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [pendingPasswordFile, setPendingPasswordFile] = useState<{
        file: File
        bytes: Uint8Array
    } | null>(null)
    const [encryptOnExport, setEncryptOnExport] = useState(false)
    const [exportPassword, setExportPassword] = useState('')
    const [exportOwnerPassword, setExportOwnerPassword] = useState('')
    const [exportAlgorithm, setExportAlgorithm] =
        useState<EncryptionAlgorithm>('AES-256')
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
    const [selectedTextBlockId, setSelectedTextBlockId] = useState<
        string | null
    >(null)
    const [pdfVersion, setPdfVersion] = useState<number>(0)
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | undefined>(undefined)
    const [pdfDebugText, setPdfDebugText] = useState<string>('')
    const [editingTextBlockId, setEditingTextBlockId] = useState<string | null>(
        null,
    )
    const [editText, setEditText] = useState<string>('')
    const [draggedFieldType, setDraggedFieldType] = useState<FieldType | null>(
        null,
    )
    const [draggingText, setDraggingText] = useState<boolean>(false)
    const [standardFonts, setStandardFonts] = useState<FontRef[]>([])
    const [embeddedFonts, setEmbeddedFonts] = useState<FontRef[]>([])
    const fontInputRef = useRef<HTMLInputElement>(null)

    const client =
        typeof Worker !== 'undefined'
            ? getSharedPdfWorkerClient()
            : (null as any)

    useEffect(() => {
        if (!pdfLoaded || pdfVersion === 0) return
        let cancelled = false
        const handle = setTimeout(async () => {
            try {
                const [bytes, debugText] = await Promise.all([
                    client.call('toBytes', undefined),
                    client.call('toDebugString', undefined),
                ])
                if (cancelled) return
                setPdfBytes(bytes)
                setPdfDebugText(debugText)
            } catch (error) {
                console.error('Error refreshing PDF bytes:', error)
            }
        }, 150)
        return () => {
            cancelled = true
            clearTimeout(handle)
        }
    }, [pdfVersion, pdfLoaded, client])

    const selectedField =
        extractedFields.find((f) => f.id === selectedFieldId) || null

    const selectedTextBlock =
        extractedTextBlocks.find((tb) => tb.id === selectedTextBlockId) || null

    const selectedTextRuns = selectedTextBlock?.runs ?? []

    const showRightPane =
        !!(selectedFieldId && selectedField) || !!selectedTextBlock

    const mergeFieldDTO = (updated: ExtractedField) => {
        setExtractedFields((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f)),
        )
    }

    const mergeFieldDTOs = (updated: ExtractedField[]) => {
        if (updated.length === 0) return
        const byId = new Map(updated.map((f) => [f.id, f]))
        setExtractedFields((prev) => prev.map((f) => byId.get(f.id) ?? f))
    }

    const mergeTextBlockDTO = (updated: ExtractedTextBlock) => {
        setExtractedTextBlocks((prev) =>
            prev.map((tb) => (tb.id === updated.id ? updated : tb)),
        )
    }

    const updateUndoRedoState = async () => {
        try {
            const state = await client.call('getUndoRedoState', {})
            setCanUndo(state.canUndo)
            setCanRedo(state.canRedo)
        } catch (error) {
            console.error('Error getting undo/redo state:', error)
        }
    }

    const handleFieldSelect = (fieldId: string) => {
        setSelectedFieldId(fieldId)
    }

    const handleFieldPropertyChange = async (
        property: string,
        value: string,
    ) => {
        if (!selectedFieldId) return
        if (
            property !== 'name' &&
            property !== 'value' &&
            property !== 'fontSize' &&
            property !== 'quadding'
        )
            return
        try {
            const updated = await client.call('updateFieldProperty', {
                id: selectedFieldId,
                property,
                value,
            })
            mergeFieldDTOs(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error updating field property:', error)
            alert(
                `Error updating field: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleAppearanceStateChange = async (value: string) => {
        if (!selectedFieldId) return
        try {
            const updated = await client.call('setAppearanceState', {
                id: selectedFieldId,
                value,
            })
            mergeFieldDTOs(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error updating appearance state:', error)
        }
    }

    const handleFieldPositionChange = async (
        fieldId: string,
        newRect: [number, number, number, number],
    ) => {
        try {
            const updated = await client.call('updateFieldRect', {
                id: fieldId,
                rect: newRect,
            })
            mergeFieldDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error updating field rect:', error)
        }
    }

    const handleRectChange = (
        property: 'x' | 'y' | 'width' | 'height',
        value: string,
    ) => {
        if (!selectedFieldId) return
        const target = extractedFields.find((f) => f.id === selectedFieldId)
        if (!target?.rect) return
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return
        const [x1, y1, x2, y2] = target.rect
        let newRect: [number, number, number, number]
        switch (property) {
            case 'x': {
                const width = x2 - x1
                newRect = [numValue, y1, numValue + width, y2]
                break
            }
            case 'y': {
                const height = y2 - y1
                newRect = [x1, numValue, x2, numValue + height]
                break
            }
            case 'width':
                newRect = [x1, y1, x1 + numValue, y2]
                break
            case 'height':
                newRect = [x1, y1, x2, y1 + numValue]
                break
        }
        handleFieldPositionChange(selectedFieldId, newRect)
    }

    const handleTextBlockDoubleClick = (blockId: string) => {
        const textBlock = extractedTextBlocks.find((tb) => tb.id === blockId)
        if (!textBlock) return
        setEditingTextBlockId(blockId)
        setEditText(textBlock.text)
        setSelectedTextBlockId(blockId)
    }

    const handleTextEditCommit = async () => {
        if (!editingTextBlockId) {
            setEditingTextBlockId(null)
            return
        }
        const textBlock = extractedTextBlocks.find(
            (tb) => tb.id === editingTextBlockId,
        )
        if (!textBlock) {
            setEditingTextBlockId(null)
            return
        }
        if (editText === textBlock.text) {
            setEditingTextBlockId(null)
            return
        }
        try {
            const updated = await client.call('editTextBlock', {
                id: editingTextBlockId,
                text: editText,
            })
            mergeTextBlockDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error editing text block:', error)
            alert(
                `Error editing text: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
        setEditingTextBlockId(null)
        setSelectedTextBlockId(null)
    }

    const handleTextEditCancel = () => {
        setEditingTextBlockId(null)
    }

    const handleTextBlockPropertyEdit = async (newText: string) => {
        if (!selectedTextBlock) return
        if (newText === selectedTextBlock.text) return
        try {
            const updated = await client.call('editTextBlock', {
                id: selectedTextBlock.id,
                text: newText,
            })
            mergeTextBlockDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error editing text block:', error)
            alert(
                `Error editing text: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleTextBlockMove = async (property: 'x' | 'y', value: string) => {
        if (!selectedTextBlock) return
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return
        const bbox = selectedTextBlock.bbox
        const dx = property === 'x' ? numValue - bbox.x : 0
        const dy = property === 'y' ? numValue - bbox.y : 0
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return
        try {
            const updated = await client.call('moveTextBlock', {
                id: selectedTextBlock.id,
                dx,
                dy,
            })
            mergeTextBlockDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error moving text block:', error)
        }
    }

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const arrayBuffer = await file.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)
            const fontRef = await client.call(
                'uploadFont',
                {
                    bytes,
                    fallbackName: file.name.replace(/\.[^.]+$/, ''),
                },
                [bytes.buffer],
            )
            setEmbeddedFonts((prev) => [...prev, fontRef])
            // Auto-apply the uploaded font to the selected text block
            if (selectedTextBlock) {
                try {
                    const updated = await client.call('setTextBlockFont', {
                        id: selectedTextBlock.id,
                        fontRefId: fontRef.id,
                    })
                    mergeTextBlockDTO(updated)
                    setPdfVersion((v) => v + 1)
                    updateUndoRedoState()
                } catch (applyError) {
                    console.error('Error applying uploaded font:', applyError)
                }
            }
        } catch (error) {
            console.error('Error loading font:', error)
            alert(
                `Error loading font: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
        e.target.value = ''
    }

    const handleFontChange = async (fontRef: FontRef) => {
        if (!selectedTextBlock) return
        try {
            const updated = await client.call('setTextBlockFont', {
                id: selectedTextBlock.id,
                fontRefId: fontRef.id,
            })
            mergeTextBlockDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error changing font:', error)
            alert(
                `Error changing font: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleTextBlockFontSizeChange = async (fontSize: number) => {
        if (!selectedTextBlock) return
        if (!Number.isFinite(fontSize) || fontSize <= 0) return
        try {
            const updated = await client.call('setTextBlockFontSize', {
                id: selectedTextBlock.id,
                fontSize,
            })
            mergeTextBlockDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error changing font size:', error)
            alert(
                `Error changing font size: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleAddPage = async () => {
        try {
            const result = await client.call('addPage', {})
            setExtractedFields(result.fields)
            setExtractedTextBlocks(result.textBlocks)
            setExtractedGraphicsBlocks(result.graphicsBlocks)
            setPageCount(result.pageCount)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error adding page:', error)
            alert(
                `Error adding page: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleRemovePage = async (pageNumber: number) => {
        try {
            const result = await client.call('removePage', { pageNumber })
            setExtractedFields(result.fields)
            setExtractedTextBlocks(result.textBlocks)
            setExtractedGraphicsBlocks(result.graphicsBlocks)
            setPageCount(result.pageCount)
            setSelectedFieldId(null)
            setSelectedTextBlockId(null)
            setEditingTextBlockId(null)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error removing page:', error)
            alert(
                `Error removing page: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleUndo = async () => {
        try {
            const result = await client.call('undo', {})
            setExtractedFields(result.fields)
            setExtractedTextBlocks(result.textBlocks)
            setExtractedGraphicsBlocks(result.graphicsBlocks)
            setPageCount(result.pageCount)
            setCanUndo(result.canUndo)
            setCanRedo(result.canRedo)
            setPdfVersion((v) => v + 1)
            setSelectedFieldId(null)
            setSelectedTextBlockId(null)
        } catch (error) {
            console.error('Cannot undo:', error)
        }
    }

    const handleRedo = async () => {
        try {
            const result = await client.call('redo', {})
            setExtractedFields(result.fields)
            setExtractedTextBlocks(result.textBlocks)
            setExtractedGraphicsBlocks(result.graphicsBlocks)
            setPageCount(result.pageCount)
            setCanUndo(result.canUndo)
            setCanRedo(result.canRedo)
            setPdfVersion((v) => v + 1)
            setSelectedFieldId(null)
            setSelectedTextBlockId(null)
        } catch (error) {
            console.error('Cannot redo:', error)
        }
    }

    const handleColorChange = async (hex: string) => {
        if (!selectedTextBlock) return
        const r = parseInt(hex.slice(1, 3), 16) / 255
        const g = parseInt(hex.slice(3, 5), 16) / 255
        const b = parseInt(hex.slice(5, 7), 16) / 255
        try {
            const updated = await client.call('setTextBlockColor', {
                id: selectedTextBlock.id,
                r,
                g,
                b,
            })
            mergeTextBlockDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error changing color:', error)
        }
    }

    const handleTextBlockPositionChange = async (
        blockId: string,
        dx: number,
        dy: number,
    ) => {
        try {
            const updated = await client.call('moveTextBlock', {
                id: blockId,
                dx,
                dy,
            })
            mergeTextBlockDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error moving text block:', error)
        }
    }

    const handleAddTextBlock = async (options?: {
        pageNumber?: number
        x?: number
        y?: number
        text?: string
        fontSize?: number
    }) => {
        try {
            const newBlock = await client.call('addTextBlock', { options })
            setExtractedTextBlocks((prev) => [...prev, newBlock])
            setSelectedTextBlockId(newBlock.id)
            setSelectedFieldId(null)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error adding text block:', error)
            alert(
                `Error adding text block: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleRemoveTextBlock = async (blockId: string) => {
        try {
            await client.call('removeTextBlock', { id: blockId })
            setExtractedTextBlocks((prev) =>
                prev.filter((tb) => tb.id !== blockId),
            )
            if (selectedTextBlockId === blockId) {
                setSelectedTextBlockId(null)
            }
            if (editingTextBlockId === blockId) {
                setEditingTextBlockId(null)
            }
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error removing text block:', error)
            alert(
                `Error removing text block: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleRemoveField = async (fieldId: string) => {
        try {
            await client.call('removeField', { id: fieldId })
            setExtractedFields((prev) => prev.filter((f) => f.id !== fieldId))
            if (selectedFieldId === fieldId) {
                setSelectedFieldId(null)
            }
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error removing field:', error)
            alert(
                `Error removing field: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleFieldOptionsChange = async (
        fieldId: string,
        options: { label: string; value: string }[],
    ) => {
        try {
            const updated = await client.call('updateFieldOptions', {
                id: fieldId,
                options,
            })
            mergeFieldDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error updating field options:', error)
            alert(
                `Error updating options: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleSignatureCredentialUpload = async (
        fieldId: string,
        pfxBytes: Uint8Array,
        password: string,
    ) => {
        try {
            const updated = await client.call('setSignatureCredential', {
                id: fieldId,
                pfxBytes,
                password,
            })
            mergeFieldDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error loading signature credential:', error)
            alert(
                `Error loading .pfx: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleSignatureCredentialClear = async (fieldId: string) => {
        try {
            const updated = await client.call('clearSignatureCredential', {
                id: fieldId,
            })
            mergeFieldDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error clearing signature credential:', error)
        }
    }

    const handleSignatureMetadataChange = async (
        fieldId: string,
        property: 'signerName' | 'reason' | 'location' | 'contactInfo',
        value: string,
    ) => {
        try {
            const updated = await client.call('updateSignatureMetadata', {
                id: fieldId,
                property,
                value,
            })
            mergeFieldDTO(updated)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error updating signature metadata:', error)
        }
    }

    const handleAddField = async (
        type: FieldType,
        options?: {
            pageNumber?: number
            x?: number
            y?: number
            width?: number
            height?: number
        },
    ) => {
        try {
            const newField = await client.call('addField', { type, options })
            setExtractedFields((prev) => [...prev, newField])
            setSelectedFieldId(newField.id)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error adding field:', error)
            alert(
                `Error adding field: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleCloneField = async (fieldId: string) => {
        try {
            const result = await client.call('cloneField', { id: fieldId })
            setExtractedFields((prev) => {
                const withUpdatedOriginal = result.updatedOriginalId
                    ? prev.map((f) =>
                          f.id === result.updatedOriginalId
                              ? {
                                    ...f,
                                    name: result.updatedOriginalName ?? f.name,
                                    value:
                                        result.updatedOriginalValue ?? f.value,
                                }
                              : f,
                      )
                    : prev
                return [...withUpdatedOriginal, result.newField]
            })
            setSelectedFieldId(result.newField.id)
            setPdfVersion((v) => v + 1)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error cloning field:', error)
            alert(
                `Error cloning field: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file')
            return
        }

        const fileBytes = new Uint8Array(await file.arrayBuffer())
        await loadPdfWithOptionalPassword(file, fileBytes)
    }

    const loadPdfWithOptionalPassword = async (
        file: File,
        fileBytes: Uint8Array,
        password?: string,
    ) => {
        try {
            setPdfLoading(true)
            setPasswordError(null)
            const result = await client.call(
                'load',
                { bytes: fileBytes, password },
                [fileBytes.buffer],
            )
            const fonts = await client.call('listStandardFonts', undefined)
            setUploadedFile(file)
            setPdfLoaded(true)
            setExtractedFields(result.fields)
            setExtractedTextBlocks(result.textBlocks)
            setExtractedGraphicsBlocks(result.graphicsBlocks)
            setPageCount(result.pageCount)
            setStandardFonts(fonts)
            setEmbeddedFonts([])
            setPdfBytes(await client.call('toBytes', undefined))
            setPdfDebugText(await client.call('toDebugString', undefined))
            setPdfVersion(0)
            updateUndoRedoState()
            // If the PDF was unlocked with a password, pre-fill encryption settings
            if (password) {
                setEncryptOnExport(true)
                setExportPassword(password)
            }
            // Clear pending password state on success
            setPendingPasswordFile(null)
            setPasswordDialogOpen(false)
        } catch (error) {
            console.error('Error loading PDF:', error)

            // Check if password is required or invalid
            if (
                error instanceof Error &&
                (error.message === 'PASSWORD_REQUIRED' ||
                    error.message === 'INVALID_PASSWORD')
            ) {
                // Store file info and show password dialog
                // Create a fresh copy since the original buffer was transferred and detached
                const freshBytes = new Uint8Array(await file.arrayBuffer())
                setPendingPasswordFile({ file, bytes: freshBytes })
                if (error.message === 'INVALID_PASSWORD') {
                    setPasswordError('Incorrect password. Please try again.')
                }
                setPasswordDialogOpen(true)
                return
            }

            alert(
                `Error loading PDF: ${error instanceof Error ? error.message : String(error)}`,
            )
        } finally {
            setPdfLoading(false)
        }
    }

    const handlePasswordSubmit = (password: string) => {
        if (pendingPasswordFile) {
            loadPdfWithOptionalPassword(
                pendingPasswordFile.file,
                pendingPasswordFile.bytes,
                password,
            )
        }
    }

    const handlePasswordCancel = () => {
        setPasswordDialogOpen(false)
        setPendingPasswordFile(null)
        setPasswordError(null)
        setPdfLoading(false)
    }

    const handleOpenClick = () => {
        fileInputRef.current?.click()
    }

    const handleNewPdf = async () => {
        try {
            setPdfLoading(true)
            const result = await client.call('createBlank', {})
            const fonts = await client.call('listStandardFonts', undefined)
            const blank = new File([new Uint8Array()], 'untitled.pdf', {
                type: 'application/pdf',
            })
            setUploadedFile(blank)
            setPdfLoaded(true)
            setExtractedFields(result.fields)
            setExtractedTextBlocks(result.textBlocks)
            setExtractedGraphicsBlocks(result.graphicsBlocks)
            setPageCount(result.pageCount)
            setStandardFonts(fonts)
            setEmbeddedFonts([])
            setPdfBytes(await client.call('toBytes', undefined))
            setPdfDebugText(await client.call('toDebugString', undefined))
            setPdfVersion(0)
            setSelectedFieldId(null)
            setSelectedTextBlockId(null)
            updateUndoRedoState()
        } catch (error) {
            console.error('Error creating new PDF:', error)
            alert(
                `Error creating new PDF: ${error instanceof Error ? error.message : String(error)}`,
            )
        } finally {
            setPdfLoading(false)
        }
    }

    const handleClearFile = async () => {
        try {
            await client.call('reset', undefined)
        } catch {}
        setUploadedFile(null)
        setPdfLoaded(false)
        setPdfBytes(undefined)
        setPdfDebugText('')
        setExtractedFields([])
        setExtractedTextBlocks([])
        setExtractedGraphicsBlocks([])
        setPageCount(0)
        setEmbeddedFonts([])
        setSelectedFieldId(null)
        setSelectedTextBlockId(null)
        setEditingTextBlockId(null)
        setPdfVersion(0)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleExportPdf = async () => {
        if (!pdfLoaded || !uploadedFile) return

        // Validate password if encryption is enabled
        if (encryptOnExport && !exportPassword.trim()) {
            alert('Please enter a user password to encrypt the PDF')
            return
        }

        try {
            let bytes: Uint8Array

            if (encryptOnExport && exportPassword.trim()) {
                // Export with password protection
                bytes = await client.call('toBytesWithPassword', {
                    password: exportPassword,
                    ownerPassword: exportOwnerPassword.trim() || undefined,
                    algorithm: exportAlgorithm,
                })
            } else {
                // Export without password
                bytes = await client.call('toBytes', undefined)
            }

            const blob = new Blob([bytes as BlobPart], {
                type: 'application/pdf',
            })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = uploadedFile.name.replace('.pdf', '_edited.pdf')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error exporting PDF:', error)
            alert(
                `Error exporting PDF: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleFieldDragStart = (type: FieldType) => {
        setDraggedFieldType(type)
    }

    const handleFieldDragEnd = () => {
        setDraggedFieldType(null)
    }

    const handleTextDragStart = () => {
        setDraggingText(true)
    }

    const handleTextDragEnd = () => {
        setDraggingText(false)
    }

    const handlePageDrop = (
        e: React.DragEvent,
        pageNumber: number,
        pageElement: HTMLElement,
    ) => {
        e.preventDefault()
        if (!draggedFieldType && !draggingText) return

        // Use the first page dimensions from extracted data to compute PDF coords
        const anyBlock =
            extractedTextBlocks.find((b) => b.page === pageNumber) ||
            extractedGraphicsBlocks.find((b) => b.page === pageNumber) ||
            extractedFields.find((f) => f.page === pageNumber)
        const pageHeight = anyBlock?.pageHeight ?? 792
        const pageWidth = anyBlock?.pageWidth ?? 612

        const pageRect = pageElement.getBoundingClientRect()
        const dropX = e.clientX - pageRect.left
        const dropY = e.clientY - pageRect.top

        const scaleX = pageWidth / pageRect.width
        const scaleY = pageHeight / pageRect.height

        const pdfX = dropX * scaleX
        const pdfY = pageHeight - dropY * scaleY

        if (draggingText) {
            handleAddTextBlock({
                pageNumber,
                x: pdfX,
                y: pdfY,
            })
            setDraggingText(false)
            return
        }

        const fieldWidth =
            draggedFieldType === 'Checkbox'
                ? 20
                : draggedFieldType === 'Signature'
                  ? 260
                  : 200
        const fieldHeight =
            draggedFieldType === 'Checkbox'
                ? 20
                : draggedFieldType === 'Choice'
                  ? 24
                  : draggedFieldType === 'Signature'
                    ? 60
                    : 30

        handleAddField(draggedFieldType!, {
            pageNumber,
            x: pdfX - fieldWidth / 2,
            y: pdfY + fieldHeight / 2,
            width: fieldWidth,
            height: fieldHeight,
        })

        setDraggedFieldType(null)
    }

    const handleBackgroundClick = () => {
        if (editingTextBlockId) {
            handleTextEditCommit()
        }
        setSelectedFieldId(null)
        setSelectedTextBlockId(null)
    }

    const handleTextBlockSelect = (id: string) => {
        setSelectedTextBlockId(id)
        setSelectedFieldId(null)
    }

    return {
        uploadedFile,
        pdfLoaded,
        pdfLoading,
        pageCount,
        zoomLevel,
        setZoomLevel,
        pdfBytes,
        pdfDebugText,
        activeView,
        setActiveView,
        fileInputRef,
        fontInputRef,
        extractedFields,
        extractedTextBlocks,
        extractedGraphicsBlocks,
        showAcroFormLayer,
        showTextLayer,
        showGraphicsLayer,
        setShowAcroFormLayer,
        setShowTextLayer,
        setShowGraphicsLayer,
        selectedFieldId,
        selectedTextBlockId,
        editingTextBlockId,
        editText,
        setEditText,
        draggedFieldType,
        draggingText,
        handleTextDragStart,
        handleTextDragEnd,
        standardFonts,
        embeddedFonts,
        selectedField,
        selectedTextBlock,
        selectedTextRuns,
        showRightPane,
        setSelectedFieldId,
        setSelectedTextBlockId,
        handleFieldSelect,
        handleFieldPropertyChange,
        handleAppearanceStateChange,
        handleFieldPositionChange,
        handleRectChange,
        handleTextBlockDoubleClick,
        handleTextEditCommit,
        handleTextEditCancel,
        handleTextBlockPropertyEdit,
        handleTextBlockMove,
        handleFontUpload,
        handleFontChange,
        handleTextBlockFontSizeChange,
        handleAddPage,
        handleRemovePage,
        handleUndo,
        handleRedo,
        canUndo,
        canRedo,
        handleColorChange,
        handleTextBlockPositionChange,
        handleRemoveField,
        handleAddField,
        handleAddTextBlock,
        handleRemoveTextBlock,
        handleCloneField,
        handleFieldOptionsChange,
        handleSignatureCredentialUpload,
        handleSignatureCredentialClear,
        handleSignatureMetadataChange,
        handleFileUpload,
        handleOpenClick,
        handleNewPdf,
        handleClearFile,
        handleExportPdf,
        handleFieldDragStart,
        handleFieldDragEnd,
        handlePageDrop,
        handleBackgroundClick,
        handleTextBlockSelect,
        passwordDialogOpen,
        passwordError,
        handlePasswordSubmit,
        handlePasswordCancel,
        encryptOnExport,
        setEncryptOnExport,
        exportPassword,
        setExportPassword,
        exportOwnerPassword,
        setExportOwnerPassword,
        exportAlgorithm,
        setExportAlgorithm,
    }
}
