/// <reference lib="webworker" />
import {
    PdfAcroForm,
    PdfButtonFormField,
    PdfAdbePkcs7DetachedSignatureObject,
    PdfChoiceFormField,
    PdfDocument,
    PdfFont,
    PdfFormField,
    PdfSignatureFormField,
    PdfTextFormField,
    PdfV1SecurityHandler,
    PdfV2SecurityHandler,
    PdfV4SecurityHandler,
    PdfV5SecurityHandler,
    GraphicsBlock,
    TextBlock,
    TextRun,
    VirtualTextBlock,
    isJpeg,
    getJpegDimensions,
} from 'pdf-lite'
import {
    PdfPasswordProtectedError,
    PdfInvalidPasswordError,
} from 'pdf-lite/errors'
import { RGBColor } from 'pdf-lite/graphics/color/rgb-color'
import type {
    AddGraphicsBlockOptions,
    CloneFieldResult,
    ExtractResult,
    FieldDTO,
    FontRef,
    GraphicsBlockDTO,
    GraphicsShapeType,
    Rect4,
    RemoveFieldResult,
    RemoveGraphicsBlockResult,
    RemoveTextBlockResult,
    TextBlockDTO,
    TextSegmentDTO,
    WorkerMethodName,
    WorkerMethods,
    WorkerRequest,
    WorkerResponse,
} from './protocol'
import { Matrix } from 'pdf-lite/graphics/geom/matrix'
import { PdfContentStreamObject } from 'pdf-lite/graphics/pdf-content-stream'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import type { PdfPage } from 'pdf-lite/pdf/pdf-page'
import type { ContentNode } from 'pdf-lite/graphics/nodes/content-node'

const ctx = self as unknown as DedicatedWorkerGlobalScope

let pdfDoc: PdfDocument | null = null

const fieldRefs = new Map<string, PdfFormField>()
const textBlockRefs = new Map<string, TextBlock>()
const graphicsBlockRefs = new Map<string, GraphicsBlock>()
const graphicsBlockMeta = new Map<
    string,
    { shapeType?: GraphicsShapeType; colorHex?: string; fill?: boolean }
>()

let nextFieldId = 0
let nextTextBlockId = 0
let nextGraphicsBlockId = 0

type EmbeddedFontEntry = { ref: FontRef; font: PdfFont }
const embeddedFonts = new Map<string, EmbeddedFontEntry>()
let nextEmbeddedFontId = 0

// Signature credentials — keyed by field name (stable across history round-trips).
type SignatureCredential = {
    privateKey: Uint8Array<ArrayBuffer>
    certificate: Uint8Array<ArrayBuffer>
    additionalCertificates: Uint8Array<ArrayBuffer>[]
    certSubject: string
    signerName?: string
    reason?: string
    location?: string
    contactInfo?: string
}
const signatureCredentials = new Map<string, SignatureCredential>()

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
        signature:
            field instanceof PdfSignatureFormField
                ? signatureDTO(field)
                : undefined,
    }
}

function signatureDTO(field: PdfSignatureFormField) {
    const cred = signatureCredentials.get(field.name)
    return {
        signerName: cred?.signerName ?? field.signerName ?? undefined,
        reason: cred?.reason ?? field.reason ?? undefined,
        location: cred?.location ?? field.location ?? undefined,
        contactInfo: cred?.contactInfo ?? field.contactInfo ?? undefined,
        hasCredential: !!cred,
        certSubject: cred?.certSubject,
    }
}

/**
 * Ensure the field has a signature object wired to the stored credential. If
 * one is already attached (e.g. after a history round-trip that dropped JS
 * state), re-attach signingInfo in place rather than creating a new one.
 */
function applyCredentialToField(field: PdfSignatureFormField): void {
    if (!pdfDoc) return
    const cred = signatureCredentials.get(field.name)
    if (!cred) return

    const signingInfo = {
        privateKey: cred.privateKey,
        certificate: cred.certificate,
        additionalCertificates: cred.additionalCertificates,
    }

    let sig = field.signature
    if (sig && 'signingInfo' in sig) {
        sig.signingInfo = signingInfo
        sig.signerName = cred.signerName ?? null
        sig.reason = cred.reason ?? null
        sig.location = cred.location ?? null
        sig.contactInfo = cred.contactInfo ?? null
    } else {
        sig = PdfAdbePkcs7DetachedSignatureObject.create({
            privateKey: cred.privateKey,
            certificate: cred.certificate,
            additionalCertificates: cred.additionalCertificates,
            name: cred.signerName,
            reason: cred.reason,
            location: cred.location,
            contactInfo: cred.contactInfo,
        })
        field.signature = sig
    }

    field.generateAppearance()

    const acroform = pdfDoc.acroform
    if (acroform) acroform.signatureFlags = 3
}

/**
 * Ensure the page's /Resources/Font dict maps `font.resourceName` to a real
 * font object in the document. Required for text content streams that reference
 * the font via `/<resourceName>`.
 */
function ensurePageFontResource(page: PdfPage, font: PdfFont): void {
    if (!pdfDoc) return
    const rawResources = page.content.get('Resources')
    const resolvedResources =
        rawResources instanceof PdfObjectReference
            ? rawResources.resolve()?.content
            : rawResources
    let resources: PdfDictionary
    if (resolvedResources instanceof PdfDictionary) {
        resources = resolvedResources
    } else {
        resources = new PdfDictionary()
        page.content.set('Resources', resources)
    }

    const rawFontDict = resources.get('Font')
    const resolvedFontDict =
        rawFontDict instanceof PdfObjectReference
            ? rawFontDict.resolve()?.content
            : rawFontDict
    let fontDict: PdfDictionary
    if (resolvedFontDict instanceof PdfDictionary) {
        fontDict = resolvedFontDict
    } else {
        fontDict = new PdfDictionary()
        resources.set('Font', fontDict)
    }

    if (fontDict.get(font.resourceName)) return

    if (font.objectNumber < 0) pdfDoc.add(font)
    fontDict.set(font.resourceName, font.reference)
}

/**
 * Append a content node (text/graphics block) to a page's content stream.
 * Prefers appending to the existing single stream; otherwise creates a new
 * stream, registers it with the document, and wires it into /Contents.
 */
function getOrCreateContentStream(page: PdfPage): PdfContentStreamObject {
    if (!pdfDoc) throw new Error('No PDF loaded')
    const entry = page.content.get('Contents')

    let target: PdfContentStreamObject | undefined
    if (entry instanceof PdfObjectReference) {
        target = entry.resolve(PdfContentStreamObject)
    } else if (entry instanceof PdfArray && entry.items.length > 0) {
        const last = entry.items[entry.items.length - 1]
        if (last instanceof PdfObjectReference) {
            target = last.resolve(PdfContentStreamObject)
        }
    }

    if (!target) {
        target = new PdfContentStreamObject()
        target.page = page
        pdfDoc.add(target)

        if (entry instanceof PdfArray) {
            entry.items.push(target.reference)
        } else if (entry instanceof PdfObjectReference) {
            page.contents = new PdfArray([entry, target.reference])
        } else {
            page.contents = target.reference
        }
    } else {
        target.page = page
    }

    return target
}

function appendToPageContents(
    page: PdfPage,
    node: ContentNode,
): PdfContentStreamObject {
    const target = getOrCreateContentStream(page)
    target.add(node)
    return target
}

function segmentToDTO(run: any): TextSegmentDTO {
    const font = run.font
    const color = run.color
    return {
        text: run.text ?? '',
        fontName: font?.fontName || 'Unknown',
        fontType: font?.fontType || 'Unknown',
        fontSize: run.fontSize ?? 12,
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
        runs: block.getRuns().map(segmentToDTO),
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
    const meta = graphicsBlockMeta.get(id)

    let colorHex = meta?.colorHex
    if (!colorHex) {
        const color = block.fillColor ?? block.strokeColor
        if (color) {
            colorHex = color.toHexString()
        }
    }

    let fill = meta?.fill
    if (fill === undefined) {
        fill = block.isFilled()
    }

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
        shapeType: meta?.shapeType,
        colorHex,
        fill,
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
        return { fields: [], textBlocks: [], graphicsBlocks: [], pageCount: 0 }
    }

    fieldRefs.clear()
    textBlockRefs.clear()
    graphicsBlockRefs.clear()
    graphicsBlockMeta.clear()
    nextFieldId = 0
    nextTextBlockId = 0
    nextGraphicsBlockId = 0

    const pages = pdfDoc.pages.toArray()
    const fields: FieldDTO[] = []

    const acroform = pdfDoc.acroform
    if (acroform) {
        const visit = (field: PdfFormField) => {
            if (field.rect) {
                if (
                    field instanceof PdfSignatureFormField &&
                    signatureCredentials.has(field.name) &&
                    !(field.signature as any)?.signingInfo
                ) {
                    // History round-trip drops signingInfo; rebuild from cache.
                    applyCredentialToField(field)
                }
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
        const blocks = page.textBlocks
        for (const block of blocks) {
            if (block.text.trim().length === 0) continue
            const id = `text_block_${nextTextBlockId++}`
            textBlockRefs.set(id, block)
            textBlocks.push(
                textBlockToDTO(block, id, pageNumber, page.height, page.width),
            )
        }
    }

    const graphicsBlocks: GraphicsBlockDTO[] = []
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const pageNumber = i + 1
        const blocks = page.rawGraphicsBlocks
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
    }

    return { fields, textBlocks, graphicsBlocks, pageCount: pages.length }
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

    async toBytes() {
        if (!pdfDoc) throw new Error('No PDF loaded')
        const cloned = pdfDoc.clone()
        await cloned.finalize()
        return cloned.toBytes()
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
        const exportDoc = pdfDoc.clone()

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
        await exportDoc.finalize()
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
        for (const run of entry.block.getRuns()) {
            run.fontSize = fontSize
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

    removePage({ pageNumber }) {
        if (!pdfDoc) throw new Error('No PDF loaded')
        const pages = pdfDoc.pages.toArray()
        if (pages.length <= 1) throw new Error('Cannot delete the last page')
        if (pageNumber < 1 || pageNumber > pages.length)
            throw new Error(`Invalid page number: ${pageNumber}`)

        const page = pages[pageNumber - 1]
        pdfDoc.pages.remove(page)
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

        const fontSize = options?.fontSize ?? 12
        const text = options?.text ?? 'New Text'
        const x = options?.x ?? 100
        const y = options?.y ?? page.height - 100

        const font = PdfFont.HELVETICA
        const block = new TextBlock(page)
        const run = new TextRun()
        run.fontSize = fontSize
        run.matrix = new Matrix({ a: 1, b: 0, c: 0, d: 1, e: x, f: y })
        block.addRun(run)
        block.font = font
        run.text = text

        ensurePageFontResource(page, font)
        const stream = appendToPageContents(page, block)

        // The block we just serialized is a detached object — grab the
        // live view from the freshly-parsed stream nodes so later edits
        // (move/edit text/font) mutate the actual content stream.
        const live = stream.textBlocks[stream.textBlocks.length - 1] ?? block

        const id = `text_block_${nextTextBlockId++}`
        textBlockRefs.set(id, live)
        const result = textBlockToDTO(
            live,
            id,
            targetPageNumber,
            page.height,
            page.width,
        )

        saveToHistory()
        return result
    },

    moveGraphicsBlock({ id, dx, dy }) {
        const block = graphicsBlockRefs.get(id)
        if (!block || !pdfDoc) throw new Error(`Graphics block ${id} not found`)
        block.moveBy(dx, dy)
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
        saveToHistory()
        return graphicsBlockToDTO(block, id, pageNumber, pageHeight, pageWidth)
    },

    resizeGraphicsBlock({ id, newWidth, newHeight }) {
        const block = graphicsBlockRefs.get(id)
        if (!block || !pdfDoc) throw new Error(`Graphics block ${id} not found`)

        block.resizeTo(newWidth, newHeight)

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
        saveToHistory()
        return graphicsBlockToDTO(block, id, pageNumber, pageHeight, pageWidth)
    },

    addGraphicsBlock({
        options,
    }: {
        options: AddGraphicsBlockOptions
    }): GraphicsBlockDTO {
        if (!pdfDoc) throw new Error('No PDF loaded')
        const pages = pdfDoc.pages.toArray()
        const targetPageNumber = options.pageNumber ?? 1
        const page = pages[targetPageNumber - 1]
        if (!page) throw new Error(`Page ${targetPageNumber} not found`)

        const x = options.x ?? 100
        const y = options.y ?? page.height - 200
        const width = options.width ?? 100
        const height = options.height ?? 100
        const rgb = options.rgb as [number, number, number] | undefined
        const fill = options.fill ?? false

        // Image shape uses a completely different embedding path
        if (options.shape === 'Image') {
            if (!options.imageBytes)
                throw new Error('Image bytes are required for Image shape')
            const imageBytes = options.imageBytes
            let imgWidth = width
            let imgHeight = height
            if (isJpeg(imageBytes)) {
                const dims = getJpegDimensions(imageBytes)
                imgWidth = dims.width
                imgHeight = dims.height
            }
            // Scale to fit within a reasonable size (max 200pt on longest side)
            const maxDim = 200
            const displayWidth =
                options.width ??
                (imgWidth > imgHeight
                    ? maxDim
                    : maxDim * (imgWidth / imgHeight))
            const displayHeight =
                options.height ??
                (imgHeight > imgWidth
                    ? maxDim
                    : maxDim * (imgHeight / imgWidth))

            const stream = getOrCreateContentStream(page)
            stream.addImage(pdfDoc, {
                imageBytes,
                x,
                y,
                displayWidth,
                displayHeight,
            })

            // Find the live ImageNode from the re-parsed stream
            const allBlocks = stream.graphicsBlocks
            const live = allBlocks[allBlocks.length - 1]
            if (!live)
                throw new Error('Failed to find embedded image in stream')

            const id = `graphics_block_${nextGraphicsBlockId++}`
            graphicsBlockRefs.set(id, live)
            graphicsBlockMeta.set(id, { shapeType: 'Image' })

            const result = graphicsBlockToDTO(
                live,
                id,
                targetPageNumber,
                page.height,
                page.width,
            )
            saveToHistory()
            return result
        }

        let block: GraphicsBlock
        switch (options.shape) {
            case 'Rectangle':
                block = GraphicsBlock.rectangle({
                    x,
                    y,
                    width,
                    height,
                    rgb,
                    fill,
                })
                break
            case 'Ellipse':
                block = GraphicsBlock.ellipse({
                    x: x + width / 2,
                    y: y + height / 2,
                    radiusX: width / 2,
                    radiusY: height / 2,
                    rgb,
                    fill,
                })
                break
            case 'Line':
                block = GraphicsBlock.line({
                    x1: x,
                    y1: y,
                    x2: x + width,
                    y2: y + height,
                    rgb,
                })
                break
            default:
                throw new Error(`Unsupported shape: ${options.shape}`)
        }

        const stream = appendToPageContents(page, block)

        // Grab the live view from the freshly-parsed stream
        const liveBlocks = stream.graphicsBlocks
        const live = liveBlocks[liveBlocks.length - 1] ?? block

        const id = `graphics_block_${nextGraphicsBlockId++}`
        graphicsBlockRefs.set(id, live)

        const colorHex = rgb
            ? `#${Math.round(rgb[0] * 255)
                  .toString(16)
                  .padStart(2, '0')}${Math.round(rgb[1] * 255)
                  .toString(16)
                  .padStart(2, '0')}${Math.round(rgb[2] * 255)
                  .toString(16)
                  .padStart(2, '0')}`
            : undefined
        graphicsBlockMeta.set(id, { shapeType: options.shape, colorHex, fill })

        const result = graphicsBlockToDTO(
            live,
            id,
            targetPageNumber,
            page.height,
            page.width,
        )

        saveToHistory()
        return result
    },

    removeGraphicsBlock({ id }) {
        const block = graphicsBlockRefs.get(id)
        if (block) {
            block.remove()
        }
        graphicsBlockRefs.delete(id)
        graphicsBlockMeta.delete(id)
        const result: RemoveGraphicsBlockResult = { removedId: id }
        saveToHistory()
        return result
    },

    updateGraphicsBlock({ id, rgb, fill }) {
        const block = graphicsBlockRefs.get(id)
        if (!block || !pdfDoc) throw new Error(`Graphics block ${id} not found`)

        if (rgb || fill !== undefined) {
            const currentColor = block.fillColor ?? block.strokeColor
            const newColor = rgb
                ? new RGBColor(rgb[0], rgb[1], rgb[2])
                : currentColor
            const shouldFill = fill ?? block.fillColor !== undefined

            block.fillColor = undefined
            block.strokeColor = undefined

            if (newColor) {
                if (shouldFill) {
                    block.fillColor = newColor
                } else {
                    block.strokeColor = newColor
                }
            }
        }

        // Update metadata
        const meta = graphicsBlockMeta.get(id) ?? {}
        if (rgb) {
            meta.colorHex = `#${Math.round(rgb[0] * 255)
                .toString(16)
                .padStart(2, '0')}${Math.round(rgb[1] * 255)
                .toString(16)
                .padStart(2, '0')}${Math.round(rgb[2] * 255)
                .toString(16)
                .padStart(2, '0')}`
        }
        if (fill !== undefined) meta.fill = fill
        graphicsBlockMeta.set(id, meta)

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

        saveToHistory()
        return graphicsBlockToDTO(block, id, pageNumber, pageHeight, pageWidth)
    },

    removeTextBlock({ id }) {
        const block = textBlockRefs.get(id)
        if (!block || !pdfDoc) throw new Error(`Text block ${id} not found`)

        if (!(block instanceof VirtualTextBlock)) {
            throw new Error(
                'Only text blocks created by the editor can be removed',
            )
        }

        const runs = block.getRuns()
        for (let i = runs.length - 1; i >= 0; i--) {
            runs[i].clearOps()
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
            const oldName = targetForValue.name
            targetForValue.name = value
            if (oldName && oldName !== value) {
                const cred = signatureCredentials.get(oldName)
                if (cred) {
                    signatureCredentials.delete(oldName)
                    signatureCredentials.set(value, cred)
                }
            }
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

        // For button fields in a group, set the parent's value
        // which triggers mutual exclusion (deselects siblings)
        const parent = field.parent
        if (field instanceof PdfButtonFormField && parent) {
            parent.value = value
        } else {
            field.appearanceState = value
        }

        // Return updated DTOs for all affected siblings
        const affected: FieldDTO[] = []
        if (parent) {
            for (const [fid, f] of fieldRefs.entries()) {
                if (f === field || f.parent === parent) {
                    affected.push(fieldToDTO(f, fid))
                }
            }
        } else {
            affected.push(fieldToDTO(field, id))
        }

        saveToHistory()
        return affected
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

    async setSignatureCredential({ id, pfxBytes, password }) {
        if (!pdfDoc) throw new Error('No PDF loaded')
        const field = fieldRefs.get(id)
        if (!(field instanceof PdfSignatureFormField)) {
            throw new Error('Field is not a signature field')
        }

        const { PFX } = await import('pki-lite/pkcs12/PFX.js')
        const pfx = PFX.fromDer(pfxBytes as Uint8Array<ArrayBuffer>)
        const items = await pfx.extractItems(password)

        if (items.privateKeys.length === 0 || items.certificates.length === 0) {
            throw new Error(
                'PFX must contain at least one private key and certificate',
            )
        }

        // Assume first cert is the signer leaf; others are the chain.
        const leaf = items.certificates[0]
        const chain = items.certificates.slice(1)
        const certSubject = leaf.tbsCertificate.subject.toHumanString()

        const existing = signatureCredentials.get(field.name)
        signatureCredentials.set(field.name, {
            privateKey: items.privateKeys[0].toDer(),
            certificate: leaf.toDer(),
            additionalCertificates: chain.map((c) => c.toDer()),
            certSubject,
            signerName: existing?.signerName ?? certSubject,
            reason: existing?.reason,
            location: existing?.location,
            contactInfo: existing?.contactInfo,
        })

        applyCredentialToField(field)
        saveToHistory()
        return fieldToDTO(field, id)
    },

    clearSignatureCredential({ id }) {
        if (!pdfDoc) throw new Error('No PDF loaded')
        const field = fieldRefs.get(id)
        if (!(field instanceof PdfSignatureFormField)) {
            throw new Error('Field is not a signature field')
        }
        signatureCredentials.delete(field.name)
        field.signature = null
        field.generateAppearance()
        saveToHistory()
        return fieldToDTO(field, id)
    },

    updateSignatureMetadata({ id, property, value }) {
        if (!pdfDoc) throw new Error('No PDF loaded')
        const field = fieldRefs.get(id)
        if (!(field instanceof PdfSignatureFormField)) {
            throw new Error('Field is not a signature field')
        }

        const cred = signatureCredentials.get(field.name)
        if (cred) {
            cred[property] = value || undefined
            signatureCredentials.set(field.name, cred)
        }

        const sig = field.signature
        if (sig) {
            if (property === 'signerName') sig.signerName = value || null
            else if (property === 'reason') sig.reason = value || null
            else if (property === 'location') sig.location = value || null
            else if (property === 'contactInfo') sig.contactInfo = value || null
            field.generateAppearance()
        }

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
        } else if (type === 'Signature') {
            const field = new PdfSignatureFormField()
            field.fieldType = 'Signature'
            field.name = fieldName
            field.rect = newRect
            field.parentRef = page.reference
            field._form = acroform
            field.isWidget = true
            field.print = true

            acroform.signatureFlags = 3 // SignaturesExist + AppendOnly
            acroform.addField(field)
            field.generateAppearance()
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
            field.combo = true

            // Add to acroform first so field has a reference for appearance generation
            acroform.addField(field)
            field.generateAppearance()
            newField = field
        }

        if (!newField) {
            throw new Error(`Creating ${type} fields is not yet supported`)
        }

        // Only add if not already added (checkbox, choice, and signature were added above)
        if (type !== 'Checkbox' && type !== 'Choice' && type !== 'Signature') {
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

        const isButton = fieldToClone instanceof PdfButtonFormField
        const isChoice = fieldToClone instanceof PdfChoiceFormField

        function createFieldOfSameType(): PdfFormField {
            if (isButton) return new PdfButtonFormField()
            if (isChoice) return new PdfChoiceFormField()
            return new PdfTextFormField()
        }

        if (fieldToClone.parent) {
            parentField = fieldToClone.parent
        } else {
            isFirstClone = true
            parentField = createFieldOfSameType()
            parentField.name = fieldToClone.name
            if (!isButton) {
                parentField.defaultAppearance =
                    fieldToClone.defaultAppearance || '/Helv 12 Tf 0 g'
            }
            if (isChoice && fieldToClone instanceof PdfChoiceFormField) {
                ;(parentField as PdfChoiceFormField).options =
                    fieldToClone.options
                parentField.combo = fieldToClone.combo
            }
            if (isButton) {
                // Set radio flag on the parent group
                ;(parentField as PdfButtonFormField).radio = true
                ;(parentField as PdfButtonFormField).noToggleToOff = true
            }
            parentField._form = pdfDoc.acroform

            const originalAsWidget = fieldToClone
            originalAsWidget.content.delete('T')
            originalAsWidget.content.delete('V')

            // Give the original widget a unique on-state for radio group
            if (isButton) {
                const originalOnState = 'Choice1'
                originalAsWidget.onState = originalOnState
                originalAsWidget.generateAppearance({
                    onStateName: originalOnState,
                })
                originalAsWidget.appearanceState = originalOnState
            }

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

            // Set the parent value to the original's on-state (it starts selected)
            if (isButton) {
                parentField.value = 'Choice1'
            } else {
                parentField.value = fieldToClone.value
            }

            updatedOriginalName = parentField.name
            updatedOriginalValue = parentField.value
        }

        // Determine unique on-state for the new widget in a button group
        const siblingCount = parentField.children.length
        const newOnState = isButton ? `Choice${siblingCount + 1}` : undefined

        const widget = createFieldOfSameType()
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
            if (isButton && newOnState) {
                widget.generateAppearance({ onStateName: newOnState })
                widget.appearanceState = 'Off'
            } else {
                widget.generateAppearance()
            }
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
        graphicsBlockMeta.clear()
        signatureCredentials.clear()
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
