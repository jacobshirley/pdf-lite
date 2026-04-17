/// <reference lib="webworker" />
import {
    PdfAcroForm,
    PdfButtonFormField,
    PdfChoiceFormField,
    PdfDocument,
    PdfFont,
    PdfFormField,
    PdfTextFormField,
    PdfV1SecurityHandler,
    PdfV2SecurityHandler,
    PdfV4SecurityHandler,
    PdfV5SecurityHandler,
    TextBlock,
    TextNode,
    VirtualTextBlock,
} from 'pdf-lite'
import {
    PdfPasswordProtectedError,
    PdfInvalidPasswordError,
} from 'pdf-lite/errors'
import { RGBColor } from 'pdf-lite/graphics/color/rgb-color'
import { SetTextMatrixOp } from 'pdf-lite/graphics/ops/text'
import type { GraphicsBlock } from 'pdf-lite'
import type {
    CloneFieldResult,
    ExtractResult,
    FieldDTO,
    FontRef,
    GraphicsBlockDTO,
    Rect4,
    RemoveFieldResult,
    RemoveTextBlockResult,
    TextBlockDTO,
    TextSegmentDTO,
    WorkerMethodName,
    WorkerMethods,
    WorkerRequest,
    WorkerResponse,
} from './protocol'

const ctx = self as unknown as DedicatedWorkerGlobalScope

let pdfDoc: PdfDocument | null = null

const fieldRefs = new Map<string, PdfFormField>()
const textBlockRefs = new Map<string, TextBlock>()
const graphicsBlockRefs = new Map<string, GraphicsBlock>()

let nextFieldId = 0
let nextTextBlockId = 0
let nextGraphicsBlockId = 0

type EmbeddedFontEntry = { ref: FontRef; font: PdfFont }
const embeddedFonts = new Map<string, EmbeddedFontEntry>()
let nextEmbeddedFontId = 0

// Undo/Redo history
const MAX_HISTORY = 50
const historyStack: Uint8Array[] = []
let historyIndex = -1

function saveToHistory() {
    if (!pdfDoc) return

    // Remove any redo states after current position
    historyStack.splice(historyIndex + 1)

    // Save current state
    const snapshot = pdfDoc.toBytes()
    historyStack.push(snapshot)

    // Limit history size
    if (historyStack.length > MAX_HISTORY) {
        historyStack.shift()
    } else {
        historyIndex++
    }
}

function canUndo(): boolean {
    return historyIndex > 0
}

function canRedo(): boolean {
    return historyIndex < historyStack.length - 1
}

const standardFontRefs: FontRef[] = PdfFont.STANDARD_FONTS.map((f) => ({
    id: `std:${f.name}`,
    name: f.name,
    kind: 'standard',
    fontType: f.font.fontType || 'Standard',
}))

function resolveFont(fontRefId: string): PdfFont | undefined {
    if (fontRefId.startsWith('std:')) {
        const name = fontRefId.slice(4)
        return PdfFont.STANDARD_FONTS.find((f) => f.name === name)?.font
    }
    return embeddedFonts.get(fontRefId)?.font
}

function fieldToDTO(field: PdfFormField, id: string): FieldDTO {
    const pages = pdfDoc?.pages.toArray() ?? []
    const fieldPage = field.page
    let pageNumber = 1
    let pageHeight = 792
    let pageWidth = 612
    if (fieldPage) {
        const idx = pages.findIndex((p) => p === fieldPage)
        if (idx !== -1) {
            pageNumber = idx + 1
            pageHeight = fieldPage.height
            pageWidth = fieldPage.width
        }
    }

    const isWidgetOnly = !field.name && !!field.parent
    const nameSource = isWidgetOnly ? field.parent : field
    const valueSource = isWidgetOnly ? field.parent : field

    return {
        id,
        name: nameSource?.name || `Unnamed Field`,
        type: field.fieldType ?? 'Unknown',
        page: pageNumber,
        rect: (field.rect ?? [0, 0, 0, 0]) as Rect4,
        value: valueSource?.value || '',
        pageHeight,
        pageWidth,
        fontSize: field.fontSize ?? undefined,
        quadding: field.quadding ?? undefined,
        appearanceState: field.appearanceState ?? undefined,
        appearanceStates: field.appearanceStates
            ? [...field.appearanceStates]
            : undefined,
        defaultAppearance: field.defaultAppearance ?? undefined,
        hasParent: !!field.parent,
        options:
            field instanceof PdfChoiceFormField ? field.options : undefined,
    }
}

function segmentToDTO(seg: any): TextSegmentDTO {
    const font = seg.font
    const color = seg.color
    return {
        text: seg.text ?? '',
        fontName: font?.fontName || 'Unknown',
        fontType: font?.fontType || 'Unknown',
        fontSize: seg.fontSize ?? 12,
        colorHex: color?.toHexString?.() ?? '#000000',
    }
}

function textBlockToDTO(
    block: TextBlock,
    id: string,
    pageNumber: number,
    pageHeight: number,
    pageWidth: number,
): TextBlockDTO {
    const bbox = block.getWorldBoundingBox()
    return {
        id,
        page: pageNumber,
        pageHeight,
        pageWidth,
        bbox: {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
        },
        text: block.text,
        segments: block.getSegments().map(segmentToDTO),
    }
}

function graphicsBlockToDTO(
    block: GraphicsBlock,
    id: string,
    pageNumber: number,
    pageHeight: number,
    pageWidth: number,
): GraphicsBlockDTO {
    const bbox = block.getWorldBoundingBox()
    return {
        id,
        page: pageNumber,
        pageHeight,
        pageWidth,
        bbox: {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
        },
    }
}

function findTextBlockEntry(id: string): {
    block: TextBlock
    pageNumber: number
    pageHeight: number
    pageWidth: number
} | null {
    const block = textBlockRefs.get(id)
    if (!block || !pdfDoc) return null
    const pages = pdfDoc.pages.toArray()
    const blockPage = block.page
    let pageNumber = 1
    let pageHeight = 792
    let pageWidth = 612
    if (blockPage) {
        const idx = pages.findIndex((p) => p === blockPage)
        if (idx !== -1) {
            pageNumber = idx + 1
            pageHeight = blockPage.height
            pageWidth = blockPage.width
        }
    }
    return { block, pageNumber, pageHeight, pageWidth }
}

function extractAll(): ExtractResult {
    if (!pdfDoc) {
        return { fields: [], textBlocks: [], graphicsBlocks: [] }
    }

    fieldRefs.clear()
    textBlockRefs.clear()
    graphicsBlockRefs.clear()
    nextFieldId = 0
    nextTextBlockId = 0
    nextGraphicsBlockId = 0

    const pages = pdfDoc.pages.toArray()
    const fields: FieldDTO[] = []

    const acroform = pdfDoc.acroform
    if (acroform) {
        const visit = (field: PdfFormField) => {
            if (field.rect) {
                const id = `field_${nextFieldId++}`
                fieldRefs.set(id, field)
                fields.push(fieldToDTO(field, id))
            }
            if (field.children && field.children.length > 0) {
                field.children.forEach((c) => visit(c))
            }
        }
        acroform.fields.forEach((f) => visit(f))
    }

    const textBlocks: TextBlockDTO[] = []
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const pageNumber = i + 1
        try {
            const blocks = page.getTextBlocks()
            for (const block of blocks) {
                if (block.text.trim().length === 0) continue
                const id = `text_block_${nextTextBlockId++}`
                textBlockRefs.set(id, block)
                textBlocks.push(
                    textBlockToDTO(
                        block,
                        id,
                        pageNumber,
                        page.height,
                        page.width,
                    ),
                )
            }
        } catch (error) {
            console.warn(
                `Failed to extract text blocks from page ${pageNumber}:`,
                error,
            )
        }
    }

    const graphicsBlocks: GraphicsBlockDTO[] = []
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const pageNumber = i + 1
        try {
            const blocks = page.extractGraphicLines()
            for (const block of blocks) {
                const id = `graphics_block_${nextGraphicsBlockId++}`
                graphicsBlockRefs.set(id, block)
                graphicsBlocks.push(
                    graphicsBlockToDTO(
                        block,
                        id,
                        pageNumber,
                        page.height,
                        page.width,
                    ),
                )
            }
        } catch (error) {
            console.warn(
                `Failed to extract graphics blocks from page ${pageNumber}:`,
                error,
            )
        }
    }

    return { fields, textBlocks, graphicsBlocks }
}

const handlers: {
    [M in WorkerMethodName]: (
        args: WorkerMethods[M]['args'],
    ) => Promise<WorkerMethods[M]['result']> | WorkerMethods[M]['result']
} = {
    async load({ bytes, password }) {
        pdfDoc = await PdfDocument.fromBytes(
            [bytes as Uint8Array<ArrayBuffer>],
            {
                password,
            },
        )

        await pdfDoc.decrypt()

        // Initialize history
        historyStack.length = 0
        historyStack.push(pdfDoc.toBytes())
        historyIndex = 0

        return extractAll()
    },

    async createBlank({ width, height }) {
        pdfDoc = PdfDocument.newDocument({
            width,
            height,
            version: '1.7',
        })
        await pdfDoc.decrypt()

        // Initialize history
        historyStack.length = 0
        historyStack.push(pdfDoc.toBytes())
        historyIndex = 0

        return extractAll()
    },

    toBytes() {
        if (!pdfDoc) throw new Error('No PDF loaded')
        return pdfDoc.toBytes()
    },

    async toBytesWithPassword({
        password,
        ownerPassword,
        algorithm,
    }: {
        password: string
        ownerPassword?: string
        algorithm?: string
    }) {
        if (!pdfDoc) throw new Error('No PDF loaded')
        // Create a copy of the document to avoid modifying the original
        const currentBytes = pdfDoc.toBytes()
        const exportDoc = await PdfDocument.fromBytes([currentBytes])

        const handlerOpts = {
            password,
            ownerPassword,
        }

        let handler
        switch (algorithm) {
            case 'RC4-40':
                handler = new PdfV1SecurityHandler(handlerOpts)
                break
            case 'RC4-128':
                handler = new PdfV2SecurityHandler(handlerOpts)
                break
            case 'AES-128':
                handler = new PdfV4SecurityHandler(handlerOpts)
                break
            case 'AES-256':
            default:
                handler = new PdfV5SecurityHandler(handlerOpts)
                break
        }

        exportDoc.securityHandler = handler

        // Encrypt the document with the password
        await exportDoc.encrypt()
        return exportDoc.toBytes()
    },

    toDebugString() {
        if (!pdfDoc) throw new Error('No PDF loaded')
        return pdfDoc.toString()
    },

    listStandardFonts() {
        return standardFontRefs
    },

    uploadFont({ bytes, fallbackName }) {
        const font = PdfFont.fromBytes(bytes as Uint8Array<ArrayBuffer>)
        const name = font.fontName || fallbackName
        const id = `embed:${nextEmbeddedFontId++}`
        const ref: FontRef = {
            id,
            name,
            kind: 'embedded',
            fontType: font.fontType || 'Font',
        }
        embeddedFonts.set(id, { ref, font })
        return ref
    },

    editTextBlock({ id, text }) {
        const entry = findTextBlockEntry(id)
        if (!entry) throw new Error(`Text block ${id} not found`)
        entry.block.text = text
        const result = textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )

        saveToHistory()
        return result
    },

    moveTextBlock({ id, dx, dy }) {
        const entry = findTextBlockEntry(id)
        if (!entry) throw new Error(`Text block ${id} not found`)
        entry.block.moveBy(dx, dy)
        const result = textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )

        saveToHistory()
        return result
    },

    setTextBlockFont({ id, fontRefId }) {
        const entry = findTextBlockEntry(id)
        if (!entry) throw new Error(`Text block ${id} not found`)
        const font = resolveFont(fontRefId)
        if (!font) throw new Error(`Font ${fontRefId} not found`)
        entry.block.font = font
        return textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )
    },

    setTextBlockFontSize({ id, fontSize }) {
        const entry = findTextBlockEntry(id)
        if (!entry) throw new Error(`Text block ${id} not found`)
        for (const seg of entry.block.getSegments()) {
            seg.fontSize = fontSize
        }
        const result = textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )

        saveToHistory()
        return result
    },

    setTextBlockColor({ id, r, g, b }) {
        const entry = findTextBlockEntry(id)
        if (!entry) throw new Error(`Text block ${id} not found`)
        entry.block.color = new RGBColor(r, g, b)
        const result = textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )

        saveToHistory()
        return result
    },

    addPage({ width, height }) {
        if (!pdfDoc) throw new Error('No PDF loaded')
        pdfDoc.pages.newPage({ width, height })
        const result = extractAll()

        saveToHistory()
        return result
    },

    addTextBlock({ options }) {
        if (!pdfDoc) throw new Error('No PDF loaded')
        const pages = pdfDoc.pages.toArray()
        if (pages.length === 0) throw new Error('No pages in PDF')

        const targetPageNumber = options?.pageNumber || 1
        const page = pages[targetPageNumber - 1] || pages[0]
        page.consolidateContentStreams()
        const stream = page.contentStreams[0]
        if (!stream) throw new Error('Page has no content stream')

        const fontSize = options?.fontSize ?? 12
        const text = options?.text ?? 'New Text'
        const x = options?.x ?? 100
        const y = options?.y ?? page.height - 100

        const block = new TextBlock(page)
        const seg = new TextNode()
        seg.fontSize = fontSize
        seg.ops.unshift(SetTextMatrixOp.create(1, 0, 0, 1, x, y))
        block.addSegment(seg)
        block.font = PdfFont.HELVETICA
        seg.text = text

        stream.nodes.push(block)

        const id = `text_block_${nextTextBlockId++}`
        textBlockRefs.set(id, block)
        const result = textBlockToDTO(
            block,
            id,
            targetPageNumber,
            page.height,
            page.width,
        )

        saveToHistory()
        return result
    },

    removeTextBlock({ id }) {
        const block = textBlockRefs.get(id)
        if (!block || !pdfDoc) throw new Error(`Text block ${id} not found`)

        if (block instanceof VirtualTextBlock) {
            for (const seg of block.getSegments()) {
                seg.ops = []
            }
        } else {
            const pages = pdfDoc.pages.toArray()
            for (const page of pages) {
                for (const stream of page.contentStreams) {
                    const nodes = stream.nodes
                    const idx = nodes.indexOf(block)
                    if (idx !== -1) {
                        nodes.splice(idx, 1)
                        break
                    }
                }
            }
        }

        textBlockRefs.delete(id)
        const result: RemoveTextBlockResult = { removedId: id }

        saveToHistory()
        return result
    },

    updateFieldProperty({ id, property, value }) {
        const field = fieldRefs.get(id)
        if (!field) throw new Error(`Field ${id} not found`)
        const isWidgetOnly = !!field.parent
        const targetForValue = isWidgetOnly ? field.parent! : field

        if (property === 'name') {
            targetForValue.name = value
        } else if (property === 'value') {
            targetForValue.value = value
        } else if (property === 'fontSize') {
            if (field.fontSize !== undefined) {
                field.fontSize = parseFloat(value) || 12
            }
        } else if (property === 'quadding') {
            const quaddingValue = parseInt(value, 10)
            if (!isNaN(quaddingValue)) {
                field.quadding = quaddingValue
            }
        }

        const affected: FieldDTO[] = []
        for (const [fid, f] of fieldRefs.entries()) {
            if (f === field) {
                affected.push(fieldToDTO(f, fid))
            } else if (isWidgetOnly && f.parent === targetForValue) {
                affected.push(fieldToDTO(f, fid))
            }
        }

        saveToHistory()
        return affected
    },

    updateFieldRect({ id, rect }) {
        const field = fieldRefs.get(id)
        if (!field) throw new Error(`Field ${id} not found`)
        field.rect = rect

        saveToHistory()
        return fieldToDTO(field, id)
    },

    setAppearanceState({ id, value }) {
        const field = fieldRefs.get(id)
        if (!field) throw new Error(`Field ${id} not found`)
        field.appearanceState = value

        saveToHistory()
        return fieldToDTO(field, id)
    },

    updateFieldOptions({ id, options }) {
        const field = fieldRefs.get(id)
        if (!field) throw new Error(`Field ${id} not found`)
        if (!(field instanceof PdfChoiceFormField)) {
            throw new Error('Field is not a choice field')
        }
        field.options = options
        if (options.length > 0) {
            const currentValue = field.value
            const hasCurrentValue = options.some(
                (opt) => opt.value === currentValue,
            )
            if (!hasCurrentValue) {
                field.value = options[0].value
            }
        }
        field.generateAppearance()

        saveToHistory()
        return fieldToDTO(field, id)
    },

    addField({ type, options }) {
        if (!pdfDoc) throw new Error('No PDF loaded')

        let acroform = pdfDoc.acroform
        if (!acroform) {
            acroform = new PdfAcroForm()
            pdfDoc.add(acroform)
            pdfDoc.root.content.set('AcroForm', acroform.reference)
        }

        const targetPageNumber = options?.pageNumber || 1
        const pages = pdfDoc.pages.toArray()
        if (pages.length === 0) throw new Error('No pages in PDF')

        const page = pages[targetPageNumber - 1] || pages[0]
        const pageHeight = page.height

        const defaultX = options?.x !== undefined ? options.x : 100
        const defaultY = options?.y !== undefined ? options.y : pageHeight - 200
        const defaultWidth = options?.width || (type === 'Checkbox' ? 20 : 200)
        const defaultHeight = options?.height || (type === 'Checkbox' ? 20 : 30)

        const newRect: Rect4 = [
            defaultX,
            defaultY - defaultHeight,
            defaultX + defaultWidth,
            defaultY,
        ]

        const timestamp = Date.now()
        const fieldName = `${type}Field_${timestamp}`

        let newField: PdfFormField | null = null

        if (type === 'Text') {
            const field = new PdfTextFormField()
            field.fieldType = 'Text'
            field.name = fieldName
            field.value = ''
            field.rect = newRect
            field.parentRef = page.reference
            field.defaultAppearance = '/Helv 12 Tf 0 g'
            field._form = acroform
            field.isWidget = true
            field.print = true
            field.updateAppearance()
            newField = field
        } else if (type === 'Checkbox') {
            const field = new PdfButtonFormField()
            field.fieldType = 'Button'
            field.rect = newRect
            field.name = fieldName
            field.parentRef = page.reference
            field._form = acroform
            field.borderWidth = 1
            field.appearanceState = 'Off'
            field.isWidget = true
            field.print = true

            // Add to acroform first so field has a reference
            acroform.addField(field)

            // Now generate appearance streams
            field.generateAppearance({ onStateName: 'Yes' })

            newField = field
        } else if (type === 'Choice') {
            const field = new PdfChoiceFormField()
            field.fieldType = 'Choice'
            field.name = fieldName
            field.value = 'Option 1'
            field.rect = newRect
            field.parentRef = page.reference
            field.defaultAppearance = '/Helv 12 Tf 0 g'
            field._form = acroform
            field.isWidget = true
            field.print = true
            field.options = [
                { label: 'Option 1', value: 'Option 1' },
                { label: 'Option 2', value: 'Option 2' },
                { label: 'Option 3', value: 'Option 3' },
            ]
            // Set combo box flag (bit 18)
            field.flags = (field.flags ?? 0) | (1 << 17)

            // Add to acroform first so field has a reference for appearance generation
            acroform.addField(field)
            field.generateAppearance()
            newField = field
        }

        if (!newField) {
            throw new Error(`Creating ${type} fields is not yet supported`)
        }

        // Only add if not already added (checkbox and choice were added above)
        if (type !== 'Checkbox' && type !== 'Choice') {
            acroform.addField(newField)
        }

        const id = `field_${nextFieldId++}`
        fieldRefs.set(id, newField)

        saveToHistory()
        return fieldToDTO(newField, id)
    },

    removeField({ id }) {
        const field = fieldRefs.get(id)
        if (!field || !pdfDoc?.acroform) {
            throw new Error(`Field ${id} not found`)
        }

        const isWidgetOnly = !!field.parent
        if (isWidgetOnly) {
            const parent = field.parent!
            const siblings = parent.children.filter((c) => c !== field)
            if (siblings.length > 0) {
                parent.children = siblings
                pdfDoc.deleteObject(field)
            } else {
                pdfDoc.deleteObject(parent)
            }
        } else {
            pdfDoc.deleteObject(field)
        }

        fieldRefs.delete(id)
        const result: RemoveFieldResult = { removedId: id }

        saveToHistory()
        return result
    },

    cloneField({ id }) {
        const fieldToClone = fieldRefs.get(id)
        if (!fieldToClone || !pdfDoc?.acroform || !fieldToClone.rect) {
            throw new Error(`Field ${id} not found`)
        }
        const page = fieldToClone.page
        if (!page) throw new Error('Page not found')

        let parentField: PdfFormField
        let isFirstClone = false
        let updatedOriginalName: string | undefined
        let updatedOriginalValue: string | undefined

        if (fieldToClone.parent) {
            parentField = fieldToClone.parent
        } else {
            isFirstClone = true
            parentField = new PdfTextFormField()
            parentField.name = fieldToClone.name
            parentField.value = fieldToClone.value
            parentField.defaultAppearance =
                fieldToClone.defaultAppearance || '/Helv 12 Tf 0 g'
            parentField._form = pdfDoc.acroform

            const originalAsWidget = fieldToClone
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

            updatedOriginalName = parentField.name
            updatedOriginalValue = parentField.value
        }

        const widget = new PdfTextFormField()
        const offsetX = 20
        const offsetY = 20
        const [x1, y1, x2, y2] = fieldToClone.rect
        const clonedRect: Rect4 = [
            x1 + offsetX,
            y1 - offsetY,
            x2 + offsetX,
            y2 - offsetY,
        ]
        widget.rect = clonedRect
        widget.parentRef = page.reference
        widget.parent = parentField
        widget._form = pdfDoc.acroform
        if (widget.generateAppearance) {
            widget.generateAppearance()
        }

        const newId = `field_${nextFieldId++}`
        fieldRefs.set(newId, widget)

        const result: CloneFieldResult = {
            newField: fieldToDTO(widget, newId),
            updatedOriginalId: isFirstClone ? id : undefined,
            updatedOriginalName,
            updatedOriginalValue,
        }

        saveToHistory()
        return result
    },

    reset() {
        pdfDoc = null
        fieldRefs.clear()
        textBlockRefs.clear()
        graphicsBlockRefs.clear()
        nextFieldId = 0
        nextTextBlockId = 0
        nextGraphicsBlockId = 0
        historyStack.length = 0
        historyIndex = -1
    },

    async undo() {
        if (!canUndo()) {
            throw new Error('Cannot undo')
        }

        historyIndex--
        const snapshot = historyStack[historyIndex]
        pdfDoc = await PdfDocument.fromBytes([
            snapshot as Uint8Array<ArrayBuffer>,
        ])
        await pdfDoc.decrypt()

        const result = extractAll()
        return {
            ...result,
            canUndo: canUndo(),
            canRedo: canRedo(),
        }
    },

    async redo() {
        if (!canRedo()) {
            throw new Error('Cannot redo')
        }

        historyIndex++
        const snapshot = historyStack[historyIndex]
        pdfDoc = await PdfDocument.fromBytes([
            snapshot as Uint8Array<ArrayBuffer>,
        ])
        await pdfDoc.decrypt()

        const result = extractAll()
        return {
            ...result,
            canUndo: canUndo(),
            canRedo: canRedo(),
        }
    },

    getUndoRedoState() {
        return {
            canUndo: canUndo(),
            canRedo: canRedo(),
        }
    },
}

ctx.addEventListener(
    'message',
    async (e: MessageEvent<WorkerRequest<WorkerMethodName>>) => {
        const { id, method, args } = e.data
        try {
            const handler = handlers[method] as (
                a: unknown,
            ) => Promise<unknown> | unknown
            const result = await handler(args)
            const transfer: Transferable[] = []
            if (result instanceof Uint8Array) {
                transfer.push(result.buffer as ArrayBuffer)
            }
            const response: WorkerResponse = {
                id,
                ok: true,
                result: result as never,
            }
            ctx.postMessage(response, transfer)
        } catch (error) {
            let errorMessage: string
            if (error instanceof PdfPasswordProtectedError) {
                errorMessage = 'PASSWORD_REQUIRED'
            } else if (error instanceof PdfInvalidPasswordError) {
                errorMessage = 'INVALID_PASSWORD'
            } else {
                errorMessage =
                    error instanceof Error ? error.message : String(error)
            }
            const response: WorkerResponse = {
                id,
                ok: false,
                error: errorMessage,
            }
            ctx.postMessage(response)
        }
    },
)
