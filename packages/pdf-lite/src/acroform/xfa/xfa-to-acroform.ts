import { PdfDocument } from '../../pdf/pdf-document.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfBoolean } from '../../core/objects/pdf-boolean.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import {
    PdfXfaTemplate,
    type XfaFieldDef,
    type XfaDrawDef,
} from './xfa-template.js'
import { PdfAnnotationWriter } from '../../annotations/pdf-annotation-writer.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'

export interface XfaToAcroFormOptions {
    /** Use NeedAppearances=true instead of generating appearance streams. Default: true */
    needAppearances?: boolean
    /** Font size for field text. Default: 0 (auto-size) */
    fontSize?: number
    /** Font resource name. Default: 'Helv' */
    fontName?: string
    /** Merge values from XFA datasets into converted fields. Default: true */
    mergeDatasets?: boolean
    /** Remove the XFA entry from the AcroForm dict after conversion. Default: true */
    stripXfa?: boolean
}

/**
 * Converts XFA form definitions to standard AcroForm fields.
 * This allows XFA-only PDFs to be viewed and filled in non-Adobe viewers.
 */
export class XfaToAcroFormConverter {
    /**
     * Convert XFA template fields to AcroForm fields in the document.
     *
     * @param document - The PDF document containing XFA forms
     * @param options - Conversion options
     * @returns The number of fields created
     */
    static async convert(
        document: PdfDocument,
        options?: XfaToAcroFormOptions,
    ): Promise<number> {
        const opts: Required<XfaToAcroFormOptions> = {
            needAppearances: options?.needAppearances ?? true,
            fontSize: options?.fontSize ?? 0,
            fontName: options?.fontName ?? 'Helv',
            mergeDatasets: options?.mergeDatasets ?? true,
            stripXfa: options?.stripXfa ?? true,
            ...options,
        }

        // 1. Load XFA form and template
        const acroFormObj = await document.acroForm.read()
        const xfaForm = await acroFormObj?.getXfa(document)

        if (!xfaForm?.template) {
            throw new Error(
                'No XFA template found in document. Ensure the PDF contains XFA form data.',
            )
        }

        // 2. Parse template XML into IR
        const template = PdfXfaTemplate.parse(xfaForm.template)
        if (template.pages.length === 0 || template.allFields.length === 0) {
            return 0
        }

        // 3. Merge dataset values if requested
        const datasetValues = new Map<string, string>()
        if (opts.mergeDatasets && xfaForm.datasets) {
            for (const field of template.allFields) {
                const value = xfaForm.datasets.getFieldValue(field.fullPath)
                if (value != null) {
                    datasetValues.set(field.fullPath, value)
                }
            }
        }

        // 4. Walk PDF page tree to collect page refs and actual dimensions
        const pageInfos = await getPageInfos(document)

        // 5. Start incremental update
        const isIncremental = document.isIncremental()
        document.setIncremental(true)

        // 6. Build Helvetica font dictionaries for default resources
        const helveticaDict = new PdfDictionary()
        helveticaDict.set('Type', new PdfName('Font'))
        helveticaDict.set('Subtype', new PdfName('Type1'))
        helveticaDict.set('BaseFont', new PdfName('Helvetica'))
        helveticaDict.set('Encoding', new PdfName('WinAnsiEncoding'))

        const helveticaObj = new PdfIndirectObject({ content: helveticaDict })
        document.add(helveticaObj)

        const helveticaBoldDict = new PdfDictionary()
        helveticaBoldDict.set('Type', new PdfName('Font'))
        helveticaBoldDict.set('Subtype', new PdfName('Type1'))
        helveticaBoldDict.set('BaseFont', new PdfName('Helvetica-Bold'))
        helveticaBoldDict.set('Encoding', new PdfName('WinAnsiEncoding'))

        const helveticaBoldObj = new PdfIndirectObject({
            content: helveticaBoldDict,
        })
        document.add(helveticaBoldObj)

        // 7. Build AcroForm dict
        const catalog = document.root
        let acroFormRef = catalog.content.get('AcroForm')
        let acroFormDict: PdfDictionary
        let acroFormContainer: PdfIndirectObject

        if (acroFormRef instanceof PdfObjectReference) {
            const existing = await document.readObject(acroFormRef)
            if (existing) {
                acroFormDict = existing.content.as(PdfDictionary).clone()
                acroFormContainer = new PdfIndirectObject({
                    objectNumber: acroFormRef.objectNumber,
                    generationNumber: acroFormRef.generationNumber,
                    content: acroFormDict,
                })
            } else {
                acroFormDict = new PdfDictionary()
                acroFormContainer = new PdfIndirectObject({
                    content: acroFormDict,
                })
            }
        } else if (acroFormRef instanceof PdfDictionary) {
            acroFormDict = acroFormRef.clone()
            acroFormContainer = new PdfIndirectObject({ content: acroFormDict })
        } else {
            acroFormDict = new PdfDictionary()
            acroFormContainer = new PdfIndirectObject({ content: acroFormDict })
        }

        // Set up default resources with Helvetica
        const drDict = new PdfDictionary()
        const fontDict = new PdfDictionary()
        fontDict.set(opts.fontName, helveticaObj.reference)
        drDict.set('Font', fontDict)
        acroFormDict.set('DR', drDict)

        // Default appearance string
        acroFormDict.set(
            'DA',
            new PdfString(`/${opts.fontName} ${opts.fontSize} Tf 0 g`),
        )

        if (opts.needAppearances) {
            acroFormDict.set('NeedAppearances', new PdfBoolean(true))
        }

        // Strip XFA entry
        if (opts.stripXfa) {
            acroFormDict.delete('XFA')
        }

        // 8. Create field widgets
        const fieldsArray = new PdfArray<PdfObjectReference>()
        const fieldsByPage = new Map<
            string,
            { pageRef: PdfObjectReference; fieldRefs: PdfObjectReference[] }
        >()

        let fieldCount = 0

        for (let pageIdx = 0; pageIdx < template.pages.length; pageIdx++) {
            const page = template.pages[pageIdx]
            const pageInfo = pageInfos[pageIdx]
            if (!pageInfo) continue

            // Compute Y offset: template coords assume template page height,
            // but actual PDF page may be different (e.g. A4 template on Letter page)
            const yOffset = pageInfo.height - page.height

            const pageKey = `${pageInfo.ref.objectNumber}_${pageInfo.ref.generationNumber}`

            for (const fieldDef of page.fields) {
                const fieldObj = createFieldWidget(
                    fieldDef,
                    pageInfo.ref,
                    datasetValues,
                    opts,
                    yOffset,
                )

                document.add(fieldObj)
                fieldsArray.push(fieldObj.reference)

                if (!fieldsByPage.has(pageKey)) {
                    fieldsByPage.set(pageKey, {
                        pageRef: pageInfo.ref,
                        fieldRefs: [],
                    })
                }
                fieldsByPage.get(pageKey)!.fieldRefs.push(fieldObj.reference)

                fieldCount++
            }
        }

        // 9. Set Fields array
        acroFormDict.set('Fields', fieldsArray)

        // 10. Add AcroForm to document
        document.add(acroFormContainer)

        // Update catalog to point to our AcroForm
        if (
            !(acroFormRef instanceof PdfObjectReference) ||
            acroFormContainer.objectNumber !== acroFormRef.objectNumber
        ) {
            let updatableCatalog = catalog
            if (catalog.isImmutable()) {
                updatableCatalog = catalog.clone()
                document.add(updatableCatalog)
            }
            updatableCatalog.content.set(
                'AcroForm',
                acroFormContainer.reference,
            )
        }

        // 11. Render draw elements as page content streams
        for (let pageIdx = 0; pageIdx < template.pages.length; pageIdx++) {
            const page = template.pages[pageIdx]
            const pageInfo = pageInfos[pageIdx]
            if (!pageInfo || page.draws.length === 0) continue

            const yOffset = pageInfo.height - page.height

            const drawStream = buildDrawContentStream(
                page.draws,
                opts.fontName,
                pageInfo.width,
                pageInfo.height,
                yOffset,
            )
            if (!drawStream) continue

            // Create content stream object
            const drawStreamObj = new PdfIndirectObject({ content: drawStream })
            document.add(drawStreamObj)

            // Read the page dict to update it
            const pageObj = await document.readObject({
                objectNumber: pageInfo.ref.objectNumber,
                generationNumber: pageInfo.ref.generationNumber,
            })
            if (!pageObj) continue

            const pageDict = pageObj.content.as(PdfDictionary).clone()

            // Add font resource to page
            let resources = pageDict.get('Resources')?.as(PdfDictionary)
            if (!resources) {
                resources = new PdfDictionary()
                pageDict.set('Resources', resources)
            } else {
                resources = resources.clone()
                pageDict.set('Resources', resources)
            }
            let pageFontDict = resources.get('Font')?.as(PdfDictionary)
            if (!pageFontDict) {
                pageFontDict = new PdfDictionary()
                resources.set('Font', pageFontDict)
            } else {
                pageFontDict = pageFontDict.clone()
                resources.set('Font', pageFontDict)
            }
            pageFontDict.set(opts.fontName, helveticaObj.reference)
            pageFontDict.set(
                `${opts.fontName}-Bold`,
                helveticaBoldObj.reference,
            )

            // Replace page contents: our draw stream replaces the original
            // "Please wait..." content entirely so draws are visible
            pageDict.set('Contents', drawStreamObj.reference)

            const updatedPage = new PdfIndirectObject({
                objectNumber: pageInfo.ref.objectNumber,
                generationNumber: pageInfo.ref.generationNumber,
                content: pageDict,
            })
            document.add(updatedPage)
        }

        // 12. Update page annotations
        await PdfAnnotationWriter.updatePageAnnotations(document, fieldsByPage)

        // 13. Commit
        await document.commit()
        document.setIncremental(isIncremental)

        return fieldCount
    }
}

interface PageInfo {
    ref: PdfObjectReference
    width: number
    height: number
}

/** Walk the PDF page tree and collect page refs + actual dimensions */
async function getPageInfos(document: PdfDocument): Promise<PageInfo[]> {
    const catalog = document.root
    const pagesRef = catalog.content.get('Pages')?.as(PdfObjectReference)
    if (!pagesRef) return []

    const infos: PageInfo[] = []
    await walkPageTree(document, pagesRef, infos, null)
    return infos
}

async function walkPageTree(
    document: PdfDocument,
    nodeRef: PdfObjectReference,
    infos: PageInfo[],
    inheritedMediaBox: PdfArray | null,
): Promise<void> {
    const nodeObj = await document.readObject({
        objectNumber: nodeRef.objectNumber,
        generationNumber: nodeRef.generationNumber,
    })
    if (!nodeObj) return

    const dict = nodeObj.content.as(PdfDictionary)
    const type = dict.get('Type')?.as(PdfName)?.value

    // MediaBox can be inherited from parent Pages node
    const localMediaBox =
        (dict.get('MediaBox')?.as(PdfArray) as PdfArray<PdfNumber>) ?? null
    const mediaBox = localMediaBox ?? inheritedMediaBox

    if (type === 'Page') {
        let width = 612
        let height = 792
        if (mediaBox && mediaBox.items.length >= 4) {
            const vals = mediaBox.items.map((n) =>
                n instanceof PdfNumber ? n.value : 0,
            )
            // MediaBox is [llx lly urx ury] — handle inverted Y
            width = Math.abs(vals[2] - vals[0])
            height = Math.abs(vals[3] - vals[1])
        }
        infos.push({
            ref: new PdfObjectReference(
                nodeRef.objectNumber,
                nodeRef.generationNumber,
            ),
            width,
            height,
        })
    } else if (type === 'Pages') {
        const kids = dict.get('Kids')?.as(PdfArray)
        if (kids) {
            for (const kid of kids.items) {
                if (kid instanceof PdfObjectReference) {
                    await walkPageTree(
                        document,
                        new PdfObjectReference(
                            kid.objectNumber,
                            kid.generationNumber,
                        ),
                        infos,
                        mediaBox,
                    )
                }
            }
        }
    }
}

/** Create a widget annotation indirect object for a single field */
function createFieldWidget(
    fieldDef: XfaFieldDef,
    pageRef: PdfObjectReference,
    datasetValues: Map<string, string>,
    opts: Required<XfaToAcroFormOptions>,
    yOffset: number = 0,
): PdfIndirectObject {
    const dict = new PdfDictionary()

    // Annotation basics
    dict.set('Type', new PdfName('Annot'))
    dict.set('Subtype', new PdfName('Widget'))

    // Field type
    dict.set('FT', new PdfName(fieldDef.type))

    // Field name
    dict.set('T', new PdfString(fieldDef.name))

    // Rect: [x1, y1, x2, y2] in PDF coordinates (with Y adjustment for actual page size)
    const adjustedY = fieldDef.y + yOffset
    const rect = new PdfArray<PdfNumber>([
        new PdfNumber(fieldDef.x),
        new PdfNumber(adjustedY),
        new PdfNumber(fieldDef.x + fieldDef.w),
        new PdfNumber(adjustedY + fieldDef.h),
    ])
    dict.set('Rect', rect)

    // Page reference
    dict.set('P', pageRef)

    // Default appearance
    dict.set('DA', new PdfString(`/${opts.fontName} ${opts.fontSize} Tf 0 g`))

    // Value — prefer dataset value, fall back to template default
    const value = datasetValues.get(fieldDef.fullPath) ?? fieldDef.value
    if (value) {
        if (fieldDef.type === 'Btn') {
            dict.set('V', new PdfName(value))
            dict.set('AS', new PdfName(value))
        } else {
            dict.set('V', new PdfString(value))
        }
    }

    // Field flags
    let flags = 0
    if (fieldDef.multiline && fieldDef.type === 'Tx') {
        flags |= 1 << 12 // Multiline bit
    }
    if (fieldDef.combo && fieldDef.type === 'Ch') {
        flags |= 1 << 17 // Combo bit
    }
    if (flags !== 0) {
        dict.set('Ff', new PdfNumber(flags))
    }

    // Choice field options
    if (fieldDef.type === 'Ch' && fieldDef.options.length > 0) {
        const optArray = new PdfArray<PdfString>(
            fieldDef.options.map((o) => new PdfString(o)),
        )
        dict.set('Opt', optArray)
    }

    // Border style
    const bsDict = new PdfDictionary()
    bsDict.set('W', new PdfNumber(1))
    bsDict.set('S', new PdfName('S'))
    dict.set('BS', bsDict)

    // MK (appearance characteristics) — background and border colors
    const mkDict = new PdfDictionary()
    // Background color: use XFA fill color, or default white for text/choice fields
    const bg = fieldDef.bgColor ?? (fieldDef.type !== 'Btn' ? [1, 1, 1] : null)
    if (bg) {
        mkDict.set(
            'BG',
            new PdfArray<PdfNumber>(bg.map((c) => new PdfNumber(c))),
        )
    }
    // Border color
    const bc = fieldDef.borderColor ?? [0, 0, 0]
    mkDict.set('BC', new PdfArray<PdfNumber>(bc.map((c) => new PdfNumber(c))))
    dict.set('MK', mkDict)

    // Annotation flags: Print
    dict.set('F', new PdfNumber(4)) // Print flag

    return new PdfIndirectObject({ content: dict })
}

/** Build a PDF content stream that renders draw elements (rectangles and text) */
function buildDrawContentStream(
    draws: XfaDrawDef[],
    fontName: string,
    pageWidth: number,
    pageHeight: number,
    yOffset: number = 0,
): PdfStream | null {
    if (draws.length === 0) return null

    const ops: string[] = []

    // Paint white background over entire page to cover "Please wait..." content
    ops.push('q')
    ops.push('1 1 1 rg')
    ops.push(`0 0 ${n(pageWidth)} ${n(pageHeight)} re f`)
    ops.push('Q')

    for (const draw of draws) {
        ops.push('q')

        const dy = draw.y + yOffset
        const dx = draw.x

        // Background fill
        if (draw.bgColor) {
            const [r, g, b] = draw.bgColor
            ops.push(`${n(r)} ${n(g)} ${n(b)} rg`)
            ops.push(`${n(dx)} ${n(dy)} ${n(draw.w)} ${n(draw.h)} re f`)
        }

        // Border stroke
        if (draw.hasBorder) {
            ops.push('0 0 0 RG') // black stroke
            ops.push('0.5 w') // thin line
            ops.push(`${n(dx)} ${n(dy)} ${n(draw.w)} ${n(draw.h)} re S`)
        }

        // Text
        if (draw.text && draw.w > 0 && draw.h > 0) {
            ops.push('BT')
            ops.push('0 0 0 rg') // black text

            const fontSize = draw.fontSize || 7
            const isBold = draw.fontWeight === 'bold'
            if (isBold) {
                ops.push(`/${fontName}-Bold ${n(fontSize)} Tf`)
            } else {
                ops.push(`/${fontName} ${n(fontSize)} Tf`)
            }

            const padding = 1
            const maxWidth = draw.w - padding * 2
            const leading = fontSize * 1.2

            // Word-wrap text into lines that fit the box width
            const lines = wrapText(draw.text, fontSize, maxWidth, isBold)

            // Position first line: top of box, descending
            const textX = dx + padding
            const topY = dy + draw.h - fontSize - padding
            ops.push(`${n(textX)} ${n(topY)} Td`)

            for (let li = 0; li < lines.length; li++) {
                if (li > 0) {
                    ops.push(`0 ${n(-leading)} Td`)
                }
                const hexText = encodeWinAnsiHex(lines[li])
                ops.push(`<${hexText}> Tj`)
            }

            ops.push('ET')
        }

        ops.push('Q')
    }

    const streamContent = ops.join('\n')
    return new PdfStream(streamContent)
}

/** Format number for PDF content stream (fixed precision, no trailing zeros) */
function n(value: number): string {
    return value.toFixed(2).replace(/\.?0+$/, '') || '0'
}

/**
 * Approximate glyph width for Helvetica in units of 1/1000 of the font size.
 * Based on standard Helvetica metrics (AFM). Returns width in points.
 */
function measureTextWidth(
    text: string,
    fontSize: number,
    bold: boolean,
): number {
    let width = 0
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i)
        width += getCharWidth(code, bold)
    }
    return (width / 1000) * fontSize
}

/** Get approximate character width in 1/1000 units for Helvetica */
function getCharWidth(code: number, bold: boolean): number {
    // Simplified Helvetica widths for common characters
    // Bold is ~5-10% wider on average
    const boldFactor = bold ? 1.08 : 1

    if (code >= 0x80) return 600 * boldFactor // approximate for extended chars

    // Space
    if (code === 0x20) return 278 * boldFactor
    // Digits 0-9
    if (code >= 0x30 && code <= 0x39) return 556 * boldFactor
    // Uppercase A-Z (approximate average ~680)
    if (code >= 0x41 && code <= 0x5a) {
        const upper: Record<number, number> = {
            0x41: 667,
            0x42: 667,
            0x43: 722,
            0x44: 722,
            0x45: 611,
            0x46: 556,
            0x47: 778,
            0x48: 722,
            0x49: 278,
            0x4a: 500,
            0x4b: 667,
            0x4c: 556,
            0x4d: 833,
            0x4e: 722,
            0x4f: 778,
            0x50: 667,
            0x51: 778,
            0x52: 722,
            0x53: 667,
            0x54: 611,
            0x55: 722,
            0x56: 667,
            0x57: 944,
            0x58: 667,
            0x59: 667,
            0x5a: 611,
        }
        return (upper[code] ?? 667) * boldFactor
    }
    // Lowercase a-z (approximate average ~500)
    if (code >= 0x61 && code <= 0x7a) {
        const lower: Record<number, number> = {
            0x61: 556,
            0x62: 556,
            0x63: 500,
            0x64: 556,
            0x65: 556,
            0x66: 278,
            0x67: 556,
            0x68: 556,
            0x69: 222,
            0x6a: 222,
            0x6b: 500,
            0x6c: 222,
            0x6d: 833,
            0x6e: 556,
            0x6f: 556,
            0x70: 556,
            0x71: 556,
            0x72: 333,
            0x73: 500,
            0x74: 278,
            0x75: 556,
            0x76: 500,
            0x77: 722,
            0x78: 500,
            0x79: 500,
            0x7a: 500,
        }
        return (lower[code] ?? 500) * boldFactor
    }
    // Punctuation
    if (code === 0x2e || code === 0x2c) return 278 * boldFactor // . ,
    if (code === 0x28 || code === 0x29) return 333 * boldFactor // ( )
    if (code === 0x2d) return 333 * boldFactor // -
    if (code === 0x2f) return 278 * boldFactor // /

    return 556 * boldFactor // default
}

/**
 * Word-wrap text to fit within a given width.
 * Breaks on spaces. If a single word exceeds maxWidth, it's placed on its own line.
 */
function wrapText(
    text: string,
    fontSize: number,
    maxWidth: number,
    bold: boolean,
): string[] {
    if (maxWidth <= 0) return [text]

    // Check if the entire text fits on one line
    if (measureTextWidth(text, fontSize, bold) <= maxWidth) {
        return [text]
    }

    const words = text.split(/\s+/)
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
        if (!word) continue

        if (currentLine === '') {
            currentLine = word
        } else {
            const testLine = currentLine + ' ' + word
            if (measureTextWidth(testLine, fontSize, bold) <= maxWidth) {
                currentLine = testLine
            } else {
                lines.push(currentLine)
                currentLine = word
            }
        }
    }

    if (currentLine) {
        lines.push(currentLine)
    }

    return lines.length > 0 ? lines : [text]
}

/**
 * Encode a string to WinAnsiEncoding hex string for PDF content streams.
 * Characters in Windows-1252 are mapped to their byte values.
 * Characters outside WinAnsiEncoding (e.g. Polish ł, ą, ę) use closest fallbacks.
 */
function encodeWinAnsiHex(text: string): string {
    const bytes: number[] = []
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i)
        if (code < 0x80) {
            // ASCII — maps directly
            bytes.push(code)
        } else if (code <= 0xff) {
            // Latin-1 Supplement (0x80-0xFF) maps directly in WinAnsiEncoding
            bytes.push(code)
        } else {
            // Outside WinAnsiEncoding — use fallback
            const fallback = UNICODE_TO_WINANSI.get(code)
            if (fallback !== undefined) {
                bytes.push(fallback)
            } else {
                bytes.push(0x3f) // '?' for unmappable
            }
        }
    }
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Mapping of Unicode code points outside Latin-1 to WinAnsiEncoding bytes */
const UNICODE_TO_WINANSI = new Map<number, number>([
    // Windows-1252 special range (0x80-0x9F differ from Unicode)
    [0x20ac, 0x80], // €
    [0x201a, 0x82], // ‚
    [0x0192, 0x83], // ƒ
    [0x201e, 0x84], // „
    [0x2026, 0x85], // …
    [0x2020, 0x86], // †
    [0x2021, 0x87], // ‡
    [0x02c6, 0x88], // ˆ
    [0x2030, 0x89], // ‰
    [0x0160, 0x8a], // Š
    [0x2039, 0x8b], // ‹
    [0x0152, 0x8c], // Œ
    [0x017d, 0x8e], // Ž
    [0x2018, 0x91], // '
    [0x2019, 0x92], // '
    [0x201c, 0x93], // "
    [0x201d, 0x94], // "
    [0x2022, 0x95], // •
    [0x2013, 0x96], // –
    [0x2014, 0x97], // —
    [0x02dc, 0x98], // ˜
    [0x2122, 0x99], // ™
    [0x0161, 0x9a], // š
    [0x203a, 0x9b], // ›
    [0x0153, 0x9c], // œ
    [0x017e, 0x9e], // ž
    [0x0178, 0x9f], // Ÿ
    // Polish characters — fallback to closest ASCII equivalents
    // (Helvetica doesn't have these glyphs in WinAnsiEncoding)
    [0x0104, 0x41], // Ą → A
    [0x0105, 0x61], // ą → a
    [0x0106, 0x43], // Ć → C
    [0x0107, 0x63], // ć → c
    [0x0118, 0x45], // Ę → E
    [0x0119, 0x65], // ę → e
    [0x0141, 0x4c], // Ł → L
    [0x0142, 0x6c], // ł → l
    [0x0143, 0x4e], // Ń → N
    [0x0144, 0x6e], // ń → n
    [0x015a, 0x53], // Ś → S
    [0x015b, 0x73], // ś → s
    [0x0179, 0x5a], // Ź → Z
    [0x017a, 0x7a], // ź → z
    [0x017b, 0x5a], // Ż → Z
    [0x017c, 0x7a], // ż → z
    // Czech/Slovak/other Central European fallbacks
    [0x010c, 0x43], // Č → C
    [0x010d, 0x63], // č → c
    [0x010e, 0x44], // Ď → D
    [0x010f, 0x64], // ď → d
    [0x011a, 0x45], // Ě → E
    [0x011b, 0x65], // ě → e
    [0x0139, 0x4c], // Ĺ → L
    [0x013a, 0x6c], // ĺ → l
    [0x013d, 0x4c], // Ľ → L
    [0x013e, 0x6c], // ľ → l
    [0x0147, 0x4e], // Ň → N
    [0x0148, 0x6e], // ň → n
    [0x0154, 0x52], // Ŕ → R
    [0x0155, 0x72], // ŕ → r
    [0x0158, 0x52], // Ř → R
    [0x0159, 0x72], // ř → r
    [0x0164, 0x54], // Ť → T
    [0x0165, 0x74], // ť → t
    [0x016e, 0x55], // Ů → U
    [0x016f, 0x75], // ů → u
])
