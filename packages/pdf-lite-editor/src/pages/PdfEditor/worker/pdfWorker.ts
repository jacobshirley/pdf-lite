/// <reference lib="webworker" />
import {
    PdfAcroForm,
    PdfButtonFormField,
    PdfDocument,
    PdfFont,
    PdfFormField,
    PdfTextFormField,
    TextBlock,
    TextNode,
    VirtualTextBlock,
} from 'pdf-lite'
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
        appearanceState: field.appearanceState ?? undefined,
        appearanceStates: field.appearanceStates
            ? [...field.appearanceStates]
            : undefined,
        defaultAppearance: field.defaultAppearance ?? undefined,
        hasParent: !!field.parent,
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
    async load({ bytes }) {
        pdfDoc = await PdfDocument.fromBytes([bytes as Uint8Array<ArrayBuffer>])
        await pdfDoc.decrypt()
        return extractAll()
    },

    async createBlank({ width, height }) {
        pdfDoc = PdfDocument.newDocument({
            width,
            height,
            version: '1.7',
        })
        await pdfDoc.decrypt()
        return extractAll()
    },

    toBytes() {
        if (!pdfDoc) throw new Error('No PDF loaded')
        return pdfDoc.toBytes()
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
        return textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )
    },

    moveTextBlock({ id, dx, dy }) {
        const entry = findTextBlockEntry(id)
        if (!entry) throw new Error(`Text block ${id} not found`)
        entry.block.moveBy(dx, dy)
        return textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )
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
        return textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )
    },

    setTextBlockColor({ id, r, g, b }) {
        const entry = findTextBlockEntry(id)
        if (!entry) throw new Error(`Text block ${id} not found`)
        entry.block.color = new RGBColor(r, g, b)
        return textBlockToDTO(
            entry.block,
            id,
            entry.pageNumber,
            entry.pageHeight,
            entry.pageWidth,
        )
    },

    addPage({ width, height }) {
        if (!pdfDoc) throw new Error('No PDF loaded')
        pdfDoc.pages.add({ width, height })
        return extractAll()
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
        return textBlockToDTO(
            block,
            id,
            targetPageNumber,
            page.height,
            page.width,
        )
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
        }

        const affected: FieldDTO[] = []
        for (const [fid, f] of fieldRefs.entries()) {
            if (f === field) {
                affected.push(fieldToDTO(f, fid))
            } else if (isWidgetOnly && f.parent === targetForValue) {
                affected.push(fieldToDTO(f, fid))
            }
        }
        return affected
    },

    updateFieldRect({ id, rect }) {
        const field = fieldRefs.get(id)
        if (!field) throw new Error(`Field ${id} not found`)
        field.rect = rect
        return fieldToDTO(field, id)
    },

    setAppearanceState({ id, value }) {
        const field = fieldRefs.get(id)
        if (!field) throw new Error(`Field ${id} not found`)
        field.appearanceState = value
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
            field.isWidget = true
            field.appearanceState = 'Off'
            field.print = true
            field.borderWidth = 1
            newField = field
        }

        if (!newField) {
            throw new Error(`Creating ${type} fields is not yet supported`)
        }

        acroform.addField(newField)

        const id = `field_${nextFieldId++}`
        fieldRefs.set(id, newField)
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
            const response: WorkerResponse = {
                id,
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            }
            ctx.postMessage(response)
        }
    },
)
