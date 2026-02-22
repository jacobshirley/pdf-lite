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

        // 4. Walk PDF page tree to collect page refs by index
        const pageRefs = await getPageRefs(document)

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
            const pageRef = pageRefs[pageIdx]
            if (!pageRef) continue

            const pageKey = `${pageRef.objectNumber}_${pageRef.generationNumber}`

            for (const fieldDef of page.fields) {
                const fieldObj = createFieldWidget(
                    fieldDef,
                    pageRef,
                    datasetValues,
                    opts,
                )

                document.add(fieldObj)
                fieldsArray.push(fieldObj.reference)

                if (!fieldsByPage.has(pageKey)) {
                    fieldsByPage.set(pageKey, { pageRef, fieldRefs: [] })
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
            const pageRef = pageRefs[pageIdx]
            if (!pageRef || page.draws.length === 0) continue

            const drawStream = buildDrawContentStream(
                page.draws,
                opts.fontName,
                page.width,
                page.height,
            )
            if (!drawStream) continue

            // Create a Form XObject for the draw content
            const drawStreamObj = new PdfIndirectObject({ content: drawStream })
            document.add(drawStreamObj)

            // Read the page dict and prepend our draw stream
            const pageObj = await document.readObject({
                objectNumber: pageRef.objectNumber,
                generationNumber: pageRef.generationNumber,
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
                objectNumber: pageRef.objectNumber,
                generationNumber: pageRef.generationNumber,
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

/** Walk the PDF page tree and collect page PdfObjectReferences in order */
async function getPageRefs(
    document: PdfDocument,
): Promise<PdfObjectReference[]> {
    const catalog = document.root
    const pagesRef = catalog.content.get('Pages')?.as(PdfObjectReference)
    if (!pagesRef) return []

    const refs: PdfObjectReference[] = []
    await walkPageTree(document, pagesRef, refs)
    return refs
}

async function walkPageTree(
    document: PdfDocument,
    nodeRef: PdfObjectReference,
    refs: PdfObjectReference[],
): Promise<void> {
    const nodeObj = await document.readObject({
        objectNumber: nodeRef.objectNumber,
        generationNumber: nodeRef.generationNumber,
    })
    if (!nodeObj) return

    const dict = nodeObj.content.as(PdfDictionary)
    const type = dict.get('Type')?.as(PdfName)?.value

    if (type === 'Page') {
        refs.push(
            new PdfObjectReference(
                nodeRef.objectNumber,
                nodeRef.generationNumber,
            ),
        )
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
                        refs,
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
): PdfIndirectObject {
    const dict = new PdfDictionary()

    // Annotation basics
    dict.set('Type', new PdfName('Annot'))
    dict.set('Subtype', new PdfName('Widget'))

    // Field type
    dict.set('FT', new PdfName(fieldDef.type))

    // Field name
    dict.set('T', new PdfString(fieldDef.name))

    // Rect: [x1, y1, x2, y2] in PDF coordinates
    const rect = new PdfArray<PdfNumber>([
        new PdfNumber(fieldDef.x),
        new PdfNumber(fieldDef.y),
        new PdfNumber(fieldDef.x + fieldDef.w),
        new PdfNumber(fieldDef.y + fieldDef.h),
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

        // Background fill
        if (draw.bgColor) {
            const [r, g, b] = draw.bgColor
            ops.push(`${n(r)} ${n(g)} ${n(b)} rg`)
            ops.push(`${n(draw.x)} ${n(draw.y)} ${n(draw.w)} ${n(draw.h)} re f`)
        }

        // Border stroke
        if (draw.hasBorder) {
            ops.push('0 0 0 RG') // black stroke
            ops.push('0.5 w') // thin line
            ops.push(`${n(draw.x)} ${n(draw.y)} ${n(draw.w)} ${n(draw.h)} re S`)
        }

        // Text
        if (draw.text && draw.w > 0 && draw.h > 0) {
            ops.push('BT')
            ops.push('0 0 0 rg') // black text

            const fontSize = draw.fontSize || 7
            if (draw.fontWeight === 'bold') {
                ops.push(`/${fontName}-Bold ${n(fontSize)} Tf`)
            } else {
                ops.push(`/${fontName} ${n(fontSize)} Tf`)
            }

            // Position text: left-aligned, vertically centered in the box
            const textX = draw.x + 1 // small left padding
            const textY = draw.y + (draw.h - fontSize) / 2 + fontSize * 0.15 // approximate baseline

            ops.push(`${n(textX)} ${n(textY)} Td`)

            // Escape text for PDF string
            const escapedText = escapePdfString(draw.text)
            ops.push(`(${escapedText}) Tj`)

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

/** Escape a string for use in a PDF literal string (parentheses) */
function escapePdfString(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\r\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\n/g, '\\n')
}
