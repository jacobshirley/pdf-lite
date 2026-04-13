import React, { useRef, useState } from 'react'
import {
    PdfButtonFormField,
    PdfDocument,
    PdfFont,
    PdfFormField,
    PdfTextFormField,
} from 'pdf-lite'
import { RGBColor } from 'pdf-lite/graphics/color/rgb-color'
import type {
    ExtractedField,
    ExtractedGraphicsBlock,
    ExtractedTextBlock,
    FieldType,
} from './types'

export function usePdfEditor() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null)
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
    const [showGraphicsLayer, setShowGraphicsLayer] = useState<boolean>(true)
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
    const [selectedTextBlockId, setSelectedTextBlockId] = useState<
        string | null
    >(null)
    const [pdfVersion, setPdfVersion] = useState<number>(0)
    const [editingTextBlockId, setEditingTextBlockId] = useState<string | null>(
        null,
    )
    const [editText, setEditText] = useState<string>('')
    const [draggedFieldType, setDraggedFieldType] = useState<FieldType | null>(
        null,
    )
    const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null)
    const [embeddedFonts, setEmbeddedFonts] = useState<
        { name: string; font: PdfFont }[]
    >([])
    const fontInputRef = useRef<HTMLInputElement>(null)

    const pdfBytes = React.useMemo(() => {
        if (!pdfDoc) return undefined
        if (pdfVersion === 0 && originalBytes) return originalBytes
        return pdfDoc.toBytes()
    }, [pdfDoc, pdfVersion, originalBytes])

    const selectedField =
        extractedFields.find((f) => f.id === selectedFieldId) || null

    const selectedTextBlock =
        extractedTextBlocks.find((tb) => tb.id === selectedTextBlockId) || null

    const selectedTextSegments = React.useMemo(() => {
        if (!selectedTextBlock) return []
        return selectedTextBlock.block.getSegments()
    }, [selectedTextBlock, pdfVersion])

    const showRightPane =
        !!(selectedFieldId && selectedField) || !!selectedTextBlock

    const handleFieldSelect = (fieldId: string) => {
        setSelectedFieldId(fieldId)
    }

    const handleFieldPropertyChange = (property: string, value: any) => {
        if (!selectedFieldId) return

        setExtractedFields((prevFields) => {
            const selected = prevFields.find((f) => f.id === selectedFieldId)
            if (!selected?.fieldRef) return prevFields

            const isWidgetOnly = !!selected.fieldRef.parent
            const targetForValue = isWidgetOnly
                ? selected.fieldRef.parent
                : selected.fieldRef
            const targetForWidget = selected.fieldRef

            if (property === 'name' && targetForValue) {
                targetForValue.name = value
            } else if (property === 'value' && targetForValue) {
                targetForValue.value = value
            } else if (property === 'fontSize') {
                if (targetForWidget.fontSize !== undefined) {
                    targetForWidget.fontSize = parseFloat(value) || 12
                }
            }

            return prevFields.map((field) => {
                if (field.id === selectedFieldId) {
                    return { ...field, [property]: value }
                }
                if (isWidgetOnly && field.fieldRef?.parent === targetForValue) {
                    return { ...field, [property]: value }
                }
                return field
            })
        })

        setPdfVersion((v) => v + 1)
    }

    const handleAppearanceStateChange = (value: string) => {
        if (!selectedField?.fieldRef) return
        selectedField.fieldRef.appearanceState = value
        setPdfVersion((v) => v + 1)
    }

    const handleFieldPositionChange = (
        fieldId: string,
        newRect: [number, number, number, number],
    ) => {
        setExtractedFields((prevFields) =>
            prevFields.map((field) => {
                if (field.id === fieldId) {
                    if (field.fieldRef) {
                        field.fieldRef.rect = newRect
                    }
                    return { ...field, rect: newRect }
                }
                return field
            }),
        )
        setPdfVersion((v) => v + 1)
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
        setEditText(textBlock.block.text)
        setSelectedTextBlockId(blockId)
    }

    const reExtractTextBlocks = () => {
        if (!pdfDoc) return
        const pages = pdfDoc.pages.toArray()
        const newTextBlocks: ExtractedTextBlock[] = []
        let textBlockIndex = 0
        for (let i = 0; i < pages.length; i++) {
            const p = pages[i]
            const pageNumber = i + 1
            try {
                const blocks = p.getTextBlocks()
                for (const block of blocks) {
                    if (block.text.trim().length === 0) continue
                    newTextBlocks.push({
                        block,
                        id: `text_block_${textBlockIndex++}`,
                        page: pageNumber,
                        pageHeight: p.height,
                        pageWidth: p.width,
                    })
                }
            } catch (error) {
                console.warn(
                    `Failed to extract text blocks from page ${pageNumber}:`,
                    error,
                )
            }
        }
        setExtractedTextBlocks(newTextBlocks)
        setPdfVersion((v) => v + 1)
    }

    const handleTextEditCommit = () => {
        if (!editingTextBlockId || !pdfDoc) {
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

        const originalText = textBlock.block.text
        if (editText === originalText) {
            setEditingTextBlockId(null)
            return
        }

        try {
            textBlock.block.text = editText
            reExtractTextBlocks()
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

    const handleTextBlockPropertyEdit = (newText: string) => {
        if (!selectedTextBlock || !pdfDoc) return
        const originalText = selectedTextBlock.block.text
        if (newText === originalText) return
        try {
            selectedTextBlock.block.text = newText
            reExtractTextBlocks()
        } catch (error) {
            console.error('Error editing text block:', error)
            alert(
                `Error editing text: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleTextBlockMove = (property: 'x' | 'y', value: string) => {
        if (!selectedTextBlock || !pdfDoc) return
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return
        const bbox = selectedTextBlock.block.getWorldBoundingBox()
        const dx = property === 'x' ? numValue - bbox.x : 0
        const dy = property === 'y' ? numValue - bbox.y : 0
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return
        try {
            selectedTextBlock.block.moveBy(dx, dy)
            reExtractTextBlocks()
        } catch (error) {
            console.error('Error moving text block:', error)
        }
    }

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const arrayBuffer = await file.arrayBuffer()
            const fontData = new Uint8Array(arrayBuffer)
            const font = PdfFont.fromBytes(fontData)
            const fontName = font.fontName || file.name.replace(/\.[^.]+$/, '')
            setEmbeddedFonts((prev) => [...prev, { name: fontName, font }])
        } catch (error) {
            console.error('Error loading font:', error)
            alert(
                `Error loading font: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
        e.target.value = ''
    }

    const handleFontChange = (font: PdfFont) => {
        if (!selectedTextBlock || !pdfDoc) return
        try {
            selectedTextBlock.block.font = font
            reExtractTextBlocks()
        } catch (error) {
            console.error('Error changing font:', error)
            alert(
                `Error changing font: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleColorChange = (hex: string) => {
        if (!selectedTextBlock) return
        const r = parseInt(hex.slice(1, 3), 16) / 255
        const g = parseInt(hex.slice(3, 5), 16) / 255
        const b = parseInt(hex.slice(5, 7), 16) / 255
        try {
            selectedTextBlock.block.color = new RGBColor(r, g, b)
            reExtractTextBlocks()
        } catch (error) {
            console.error('Error changing color:', error)
        }
    }

    const handleTextBlockPositionChange = (
        blockId: string,
        dx: number,
        dy: number,
    ) => {
        if (!pdfDoc) return

        const textBlock = extractedTextBlocks.find((tb) => tb.id === blockId)
        if (!textBlock) return

        try {
            textBlock.block.moveBy(dx, dy)
            reExtractTextBlocks()
        } catch (error) {
            console.error('Error moving text block:', error)
        }
    }

    const handleRemoveField = (fieldId: string) => {
        const fieldToRemove = extractedFields.find((f) => f.id === fieldId)
        if (!fieldToRemove || !pdfDoc?.acroform || !fieldToRemove.fieldRef)
            return

        const isWidgetOnly = !!fieldToRemove.fieldRef.parent

        if (isWidgetOnly) {
            const parent = fieldToRemove.fieldRef.parent!
            const siblings = parent.children.filter(
                (child) => child !== fieldToRemove.fieldRef,
            )

            if (siblings.length > 0) {
                parent.children = siblings
                pdfDoc.deleteObject(fieldToRemove.fieldRef)
            } else {
                pdfDoc.deleteObject(parent)
            }
        } else {
            pdfDoc.deleteObject(fieldToRemove.fieldRef)
        }

        setExtractedFields((prevFields) =>
            prevFields.filter((f) => f.id !== fieldId),
        )

        if (selectedFieldId === fieldId) {
            setSelectedFieldId(null)
        }

        setPdfVersion((v) => v + 1)
    }

    const handleAddField = (
        type: FieldType,
        options?: {
            pageNumber?: number
            x?: number
            y?: number
            width?: number
            height?: number
        },
    ) => {
        if (!pdfDoc?.acroform) return

        const targetPageNumber = options?.pageNumber || 1
        const pages = pdfDoc.pages.toArray()
        if (pages.length === 0) {
            alert('No pages in PDF')
            return
        }

        const page = pages[targetPageNumber - 1] || pages[0]
        const pageHeight = page.height
        const pageWidth = page.width

        const defaultX = options?.x !== undefined ? options.x : 100
        const defaultY = options?.y !== undefined ? options.y : pageHeight - 200
        const defaultWidth = options?.width || (type === 'Checkbox' ? 20 : 200)
        const defaultHeight = options?.height || (type === 'Checkbox' ? 20 : 30)

        const newRect: [number, number, number, number] = [
            defaultX,
            defaultY - defaultHeight,
            defaultX + defaultWidth,
            defaultY,
        ]

        const timestamp = Date.now()
        const fieldName = `${type}Field_${timestamp}`

        let newField: PdfFormField | null = null

        if (type === 'Text') {
            const combinedField = new PdfTextFormField()
            combinedField.name = fieldName
            combinedField.value = ''
            combinedField.rect = newRect
            combinedField.parentRef = page.reference
            combinedField.defaultAppearance = '/Helv 12 Tf 0 g'

            if (pdfDoc.acroform) {
                combinedField._form = pdfDoc.acroform
            }

            combinedField.updateAppearance()

            newField = combinedField
        } else if (type === 'Checkbox') {
            const checkboxField = new PdfButtonFormField()

            checkboxField.rect = newRect
            checkboxField.name = fieldName
            checkboxField.parentRef = page.reference

            if (pdfDoc.acroform) {
                checkboxField._form = pdfDoc.acroform
            }

            checkboxField.isWidget = true
            checkboxField.appearanceState = 'Off'
            checkboxField.print = true
            checkboxField.borderWidth = 1

            newField = checkboxField
        }

        if (!newField) {
            alert(`Creating ${type} fields is not yet fully implemented`)
            return
        }

        pdfDoc.acroform.addField(newField)

        const newExtractedField: ExtractedField = {
            id: `field_${extractedFields.length}`,
            name: fieldName,
            type: type,
            page: targetPageNumber,
            rect: newRect,
            value: '',
            pageHeight: pageHeight,
            pageWidth: pageWidth,
            fieldRef: newField,
        }

        setExtractedFields((prevFields) => [...prevFields, newExtractedField])
        setSelectedFieldId(newExtractedField.id)

        setPdfVersion((v) => v + 1)
    }

    const handleCloneField = (fieldId: string) => {
        const fieldToClone = extractedFields.find((f) => f.id === fieldId)
        if (!fieldToClone) return
        if (!pdfDoc?.acroform) return
        if (!fieldToClone.fieldRef) return
        if (!fieldToClone.rect) return

        const page = pdfDoc.pages.toArray()[fieldToClone.page - 1]
        if (!page) return

        try {
            let parentField: PdfFormField
            let isFirstClone = false

            if (fieldToClone.fieldRef.parent) {
                parentField = fieldToClone.fieldRef.parent
            } else {
                isFirstClone = true

                parentField = new PdfTextFormField()
                parentField.name = fieldToClone.name
                parentField.value = fieldToClone.value
                parentField.defaultAppearance =
                    fieldToClone.fieldRef.defaultAppearance || '/Helv 12 Tf 0 g'

                if (pdfDoc.acroform) {
                    parentField._form = pdfDoc.acroform
                }

                const originalAsWidget = fieldToClone.fieldRef
                originalAsWidget.content.delete('T')
                originalAsWidget.content.delete('V')

                originalAsWidget.parent = parentField

                const acroformFields = pdfDoc.acroform.fields
                const originalIndex = acroformFields.findIndex(
                    (f) => f === originalAsWidget,
                )
                if (originalIndex !== -1) {
                    pdfDoc.acroform.fields = pdfDoc.acroform.fields.filter(
                        (_, i) => i !== originalIndex,
                    )
                }
                pdfDoc.acroform.addField(parentField)
            }

            const widget = new PdfTextFormField()
            const offsetX = 20
            const offsetY = 20
            const [x1, y1, x2, y2] = fieldToClone.rect
            const clonedRect: [number, number, number, number] = [
                x1 + offsetX,
                y1 - offsetY,
                x2 + offsetX,
                y2 - offsetY,
            ]
            widget.rect = clonedRect
            widget.parentRef = page.reference
            widget.parent = parentField

            if (pdfDoc.acroform) {
                widget._form = pdfDoc.acroform
            }

            if (widget.generateAppearance) {
                widget.generateAppearance()
            }

            const newExtractedField: ExtractedField = {
                id: `field_${extractedFields.length}`,
                name: parentField.name || fieldToClone.name,
                type: fieldToClone.type,
                page: fieldToClone.page,
                rect: clonedRect,
                value: parentField.value || fieldToClone.value,
                pageHeight: fieldToClone.pageHeight,
                pageWidth: fieldToClone.pageWidth,
                fieldRef: widget,
            }

            setExtractedFields((prevFields) => {
                if (isFirstClone) {
                    return [
                        ...prevFields.map((f) =>
                            f.id === fieldId
                                ? {
                                      ...f,
                                      name: parentField.name,
                                      value: parentField.value,
                                  }
                                : f,
                        ),
                        newExtractedField,
                    ]
                }
                return [...prevFields, newExtractedField]
            })
            setSelectedFieldId(newExtractedField.id)
            setPdfVersion((v) => v + 1)
        } catch (error) {
            console.error('Error during clone:', error)
            alert(
                `Error cloning field: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const extractOverlays = (document: PdfDocument) => {
        const pages = document.pages.toArray()

        const acroform = document.acroform
        const fields: ExtractedField[] = []

        if (acroform) {
            let fieldIndex = 0

            const extractField = (field: PdfFormField) => {
                const fieldPage = field.page
                const rect = field.rect

                let pageNumber = 1
                let pageHeight = 792
                let pageWidth = 612

                if (fieldPage) {
                    const pageIndex = pages.findIndex(
                        (p: any) => p === fieldPage,
                    )
                    if (pageIndex !== -1) {
                        pageNumber = pageIndex + 1
                        pageHeight = fieldPage.height
                        pageWidth = fieldPage.width
                    }
                }

                if (rect) {
                    const isWidgetOnly = !field.name && field.parent
                    const nameSource = isWidgetOnly ? field.parent : field
                    const valueSource = isWidgetOnly ? field.parent : field

                    fields.push({
                        id: `field_${fieldIndex++}`,
                        name: nameSource?.name || `Unnamed Field ${fieldIndex}`,
                        type: field.fieldType,
                        page: pageNumber,
                        rect: rect,
                        value: valueSource?.value || '',
                        pageHeight: pageHeight,
                        pageWidth: pageWidth,
                        fieldRef: field,
                    })
                }

                if (field.children && field.children.length > 0) {
                    field.children.forEach((child: any) => extractField(child))
                }
            }

            acroform.fields.forEach((field: any) => extractField(field))
        }

        setExtractedFields(fields)

        const textBlocks: ExtractedTextBlock[] = []
        let textBlockIndex = 0

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i]
            const pageNumber = i + 1

            const blocks = page.getTextBlocks()
            for (const block of blocks) {
                if (block.text.trim().length === 0) continue
                textBlocks.push({
                    block,
                    id: `text_block_${textBlockIndex++}`,
                    page: pageNumber,
                    pageHeight: page.height,
                    pageWidth: page.width,
                })
            }
        }

        setExtractedTextBlocks(textBlocks)

        const graphicsBlocks: ExtractedGraphicsBlock[] = []
        let graphicsBlockIndex = 0

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i]
            const pageNumber = i + 1

            try {
                const blocks = page.extractGraphicLines()
                for (const block of blocks) {
                    graphicsBlocks.push({
                        block,
                        id: `graphics_block_${graphicsBlockIndex++}`,
                        page: pageNumber,
                        pageHeight: page.height,
                        pageWidth: page.width,
                    })
                }
            } catch (error) {
                console.warn(
                    `Failed to extract graphics blocks from page ${pageNumber}:`,
                    error,
                )
            }
        }

        setExtractedGraphicsBlocks(graphicsBlocks)
    }

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        if (file && file.type === 'application/pdf') {
            try {
                const fileBytes = new Uint8Array(await file.arrayBuffer())
                const document = await PdfDocument.fromBytes([fileBytes])
                await document.decrypt()

                setOriginalBytes(fileBytes)
                setUploadedFile(file)
                setPdfDoc(document)
                setPdfVersion(0)

                requestAnimationFrame(() => {
                    extractOverlays(document)
                })
            } catch (error) {
                console.error('Error loading PDF:', error)
                alert(
                    `Error loading PDF: ${error instanceof Error ? error.message : String(error)}`,
                )
            }
        } else if (file) {
            alert('Please upload a PDF file')
        }
    }

    const handleOpenClick = () => {
        fileInputRef.current?.click()
    }

    const handleClearFile = () => {
        setUploadedFile(null)
        setPdfDoc(null)
        setOriginalBytes(null)
        setExtractedFields([])
        setExtractedTextBlocks([])
        setExtractedGraphicsBlocks([])
        setSelectedFieldId(null)
        setSelectedTextBlockId(null)
        setEditingTextBlockId(null)
        setPdfVersion(0)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleExportPdf = () => {
        if (!pdfDoc || !uploadedFile) return

        const bytes = pdfDoc.toBytes()
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = uploadedFile.name.replace('.pdf', '_edited.pdf')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const handleFieldDragStart = (type: FieldType) => {
        setDraggedFieldType(type)
    }

    const handleFieldDragEnd = () => {
        setDraggedFieldType(null)
    }

    const handlePageDrop = (
        e: React.DragEvent,
        pageNumber: number,
        pageElement: HTMLElement,
    ) => {
        e.preventDefault()
        if (!draggedFieldType || !pdfDoc) return

        const pages = pdfDoc.pages.toArray()
        const page = pages[pageNumber - 1]
        if (!page) return

        const pageHeight = page.height
        const pageWidth = page.width

        const pageRect = pageElement.getBoundingClientRect()
        const dropX = e.clientX - pageRect.left
        const dropY = e.clientY - pageRect.top

        const scaleX = pageWidth / pageRect.width
        const scaleY = pageHeight / pageRect.height

        const pdfX = dropX * scaleX
        const pdfY = pageHeight - dropY * scaleY

        const fieldWidth = draggedFieldType === 'Checkbox' ? 20 : 200
        const fieldHeight = draggedFieldType === 'Checkbox' ? 20 : 30

        handleAddField(draggedFieldType, {
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
        pdfDoc,
        pdfBytes,
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
        embeddedFonts,
        selectedField,
        selectedTextBlock,
        selectedTextSegments,
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
        handleColorChange,
        handleTextBlockPositionChange,
        handleRemoveField,
        handleAddField,
        handleCloneField,
        handleFileUpload,
        handleOpenClick,
        handleClearFile,
        handleExportPdf,
        handleFieldDragStart,
        handleFieldDragEnd,
        handlePageDrop,
        handleBackgroundClick,
        handleTextBlockSelect,
    }
}
