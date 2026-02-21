import { PdfDocument } from '../../pdf/pdf-document.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'

export interface PdfXfaFieldLayout {
    /** Fully-qualified dot-separated field name (e.g. "form1.subform1.Name") */
    name: string
    /** Field type derived from the ui element */
    type: 'Text' | 'Button' | 'Choice' | 'Draw' | 'Unknown'
    /** Font typeface name from the font element */
    fontName?: string
    /** Font size in PDF points */
    fontSize?: number
    /** Caption text extracted from caption > value > text */
    captionText?: string
    /** Choice options (for Choice type) */
    options?: string[]
    /** X position in PDF points (relative to parent subform) */
    x?: number
    /** Y position in PDF points (relative to parent subform, XFA origin = top-left) */
    y?: number
    /** Width in PDF points */
    w?: number
    /** Height in PDF points */
    h?: number
}

// ---------------------------------------------------------------------------
// Minimal XML parser — handles namespaced elements, attributes, and nesting.
// No external dependencies required.
// ---------------------------------------------------------------------------

interface XmlElement {
    localName: string
    attrs: Record<string, string>
    children: XmlElement[]
    text: string
}

function parseUnit(val: string | undefined): number | undefined {
    if (!val) return undefined
    const m = val.match(/^([\d.]+)(pt|mm|in|cm|px)?$/)
    if (!m) return undefined
    const n = parseFloat(m[1])
    const unit = m[2] ?? 'pt'
    switch (unit) {
        case 'pt':
            return n
        case 'mm':
            return (n * 72) / 25.4
        case 'in':
            return n * 72
        case 'cm':
            return (n * 72) / 2.54
        default:
            return n
    }
}

function unescapeXml(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
}

function parseXml(xml: string): XmlElement {
    let pos = 0
    const len = xml.length

    function skipWS(): void {
        while (pos < len && /\s/.test(xml[pos])) pos++
    }

    function skipUntil(s: string): void {
        const end = xml.indexOf(s, pos)
        pos = end >= 0 ? end + s.length : len
    }

    function parseElement(): XmlElement {
        pos++ // skip '<'

        // Handle processing instructions: <?...?>
        if (pos < len && xml[pos] === '?') {
            skipUntil('?>')
            skipWS()
            if (pos < len && xml[pos] === '<') return parseElement()
            return { localName: '', attrs: {}, children: [], text: '' }
        }

        // Handle comments: <!--...-->
        if (xml.startsWith('!--', pos)) {
            skipUntil('-->')
            skipWS()
            if (pos < len && xml[pos] === '<') return parseElement()
            return { localName: '', attrs: {}, children: [], text: '' }
        }

        // Handle DOCTYPE and other <!…> declarations
        if (pos < len && xml[pos] === '!') {
            skipUntil('>')
            skipWS()
            if (pos < len && xml[pos] === '<') return parseElement()
            return { localName: '', attrs: {}, children: [], text: '' }
        }

        // Tag name — strip namespace prefix (e.g. "xfa:field" → "field")
        const nameStart = pos
        while (pos < len && !/[\s>/]/.test(xml[pos])) pos++
        const rawName = xml.slice(nameStart, pos)
        const colon = rawName.indexOf(':')
        const localName = colon >= 0 ? rawName.slice(colon + 1) : rawName

        // Attributes
        const attrs: Record<string, string> = {}
        skipWS()
        while (pos < len && xml[pos] !== '>' && xml[pos] !== '/') {
            const aStart = pos
            while (pos < len && !/[\s=/>]/.test(xml[pos])) pos++
            const aName = xml.slice(aStart, pos)
            skipWS()
            if (pos < len && xml[pos] === '=') {
                pos++
                skipWS()
                const q = xml[pos]
                if (q === '"' || q === "'") {
                    pos++
                    const vStart = pos
                    while (pos < len && xml[pos] !== q) pos++
                    attrs[aName] = unescapeXml(xml.slice(vStart, pos))
                    if (pos < len) pos++ // closing quote
                }
            }
            skipWS()
        }

        // Self-closing?
        if (pos < len && xml[pos] === '/') {
            pos++ // skip '/'
            if (pos < len && xml[pos] === '>') pos++ // skip '>'
            return { localName, attrs, children: [], text: '' }
        }
        if (pos < len) pos++ // skip '>'

        // Children and text content
        const children: XmlElement[] = []
        let text = ''

        while (pos < len) {
            if (xml[pos] === '<') {
                if (xml[pos + 1] === '/') {
                    // End tag
                    pos += 2
                    while (pos < len && xml[pos] !== '>') pos++
                    if (pos < len) pos++ // skip '>'
                    break
                } else {
                    children.push(parseElement())
                }
            } else {
                const tStart = pos
                while (pos < len && xml[pos] !== '<') pos++
                text += xml.slice(tStart, pos)
            }
        }

        return { localName, attrs, children, text: unescapeXml(text.trim()) }
    }

    skipWS()
    if (pos < len && xml[pos] === '<') {
        return parseElement()
    }
    return { localName: 'root', attrs: {}, children: [], text: '' }
}

// ---------------------------------------------------------------------------
// XFA template tree walking
// ---------------------------------------------------------------------------

function findChild(el: XmlElement, localName: string): XmlElement | undefined {
    return el.children.find((c) => c.localName === localName)
}

function findChildren(el: XmlElement, localName: string): XmlElement[] {
    return el.children.filter((c) => c.localName === localName)
}

function findDescendant(
    el: XmlElement,
    localName: string,
): XmlElement | undefined {
    for (const child of el.children) {
        if (child.localName === localName) return child
        const found = findDescendant(child, localName)
        if (found) return found
    }
    return undefined
}

function detectFieldType(el: XmlElement): PdfXfaFieldLayout['type'] {
    const ui = findChild(el, 'ui')
    if (!ui) return 'Unknown'
    for (const child of ui.children) {
        switch (child.localName) {
            case 'textEdit':
                return 'Text'
            case 'checkButton':
                return 'Button'
            case 'choiceList':
                return 'Choice'
            case 'button':
                return 'Button'
            case 'dateTimeEdit':
            case 'numericEdit':
            case 'passwordEdit':
            case 'imageEdit':
                return 'Text'
        }
    }
    return 'Unknown'
}

function extractFontInfo(el: XmlElement): {
    fontName?: string
    fontSize?: number
} {
    const font = findChild(el, 'font')
    if (!font) return {}
    return {
        fontName: font.attrs['typeface'] || undefined,
        fontSize: parseUnit(font.attrs['size']),
    }
}

function extractCaptionText(el: XmlElement): string | undefined {
    const caption = findChild(el, 'caption')
    if (!caption) return undefined
    const value = findChild(caption, 'value')
    if (!value) return undefined
    const text = findChild(value, 'text')
    return text?.text || undefined
}

function extractOptions(el: XmlElement): string[] {
    const options: string[] = []
    for (const items of findChildren(el, 'items')) {
        for (const textEl of items.children) {
            if (textEl.text) options.push(textEl.text)
        }
    }
    return options
}

function walkSubform(
    el: XmlElement,
    results: PdfXfaFieldLayout[],
    namePrefix: string,
): void {
    for (const child of el.children) {
        if (child.localName === 'subform') {
            const subName = child.attrs['name']
            const prefix = subName
                ? namePrefix
                    ? `${namePrefix}.${subName}`
                    : subName
                : namePrefix
            walkSubform(child, results, prefix)
        } else if (child.localName === 'field' || child.localName === 'draw') {
            const fieldName = child.attrs['name']
            if (!fieldName) continue

            const fullName = namePrefix
                ? `${namePrefix}.${fieldName}`
                : fieldName
            const isDraw = child.localName === 'draw'
            const type = isDraw ? 'Draw' : detectFieldType(child)
            const { fontName, fontSize } = extractFontInfo(child)
            const captionText = extractCaptionText(child)
            const options =
                type === 'Choice' ? extractOptions(child) : undefined

            results.push({
                name: fullName,
                type,
                fontName,
                fontSize,
                captionText,
                options: options?.length ? options : undefined,
                x: parseUnit(child.attrs['x']),
                y: parseUnit(child.attrs['y']),
                w: parseUnit(child.attrs['w']),
                h: parseUnit(child.attrs['h']),
            })
        }
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses an XFA template component stream and extracts positioned field layout
 * information for use in appearance stream generation.
 *
 * Only handles Level 1 positioned layouts (explicit x/y/w/h on every field).
 * Flow-layout, dynamic, and scripted XFA are out of scope.
 */
export class PdfXfaTemplate {
    private xml: string

    constructor(xml: string) {
        this.xml = xml
    }

    /**
     * Walks the XFA template XML and extracts a flat list of field layouts.
     * Each entry carries the fully-qualified name, UI type, geometry, font
     * info, and caption text.
     */
    extractFieldLayouts(): PdfXfaFieldLayout[] {
        const root = parseXml(this.xml)
        const results: PdfXfaFieldLayout[] = []

        // Locate the <template> element (may be root or nested under <xdp>)
        let templateEl: XmlElement | undefined
        if (root.localName === 'template') {
            templateEl = root
        } else {
            templateEl = findDescendant(root, 'template')
        }

        if (!templateEl) return results

        walkSubform(templateEl, results, '')
        return results
    }

    /**
     * Loads the XFA template component stream from a document and returns a
     * PdfXfaTemplate, or null if no template component is present.
     */
    static async fromDocument(
        document: PdfDocument,
    ): Promise<PdfXfaTemplate | null> {
        const catalog = document.root
        const acroFormRef = catalog.content.get('AcroForm')
        if (!acroFormRef) return null

        let acroFormDict: PdfDictionary

        if (acroFormRef instanceof PdfObjectReference) {
            const acroFormObject = await document.readObject(acroFormRef)
            if (!acroFormObject) return null
            acroFormDict = acroFormObject.content.as(PdfDictionary)
        } else if (acroFormRef instanceof PdfDictionary) {
            acroFormDict = acroFormRef
        } else {
            return null
        }

        const xfaArray = acroFormDict.get('XFA')
        if (!(xfaArray instanceof PdfArray)) return null

        const items = xfaArray.items
        for (let i = 0; i < items.length - 1; i += 2) {
            const name = items[i]
            const ref = items[i + 1]

            if (
                name instanceof PdfString &&
                name.value === 'template' &&
                ref instanceof PdfObjectReference
            ) {
                const templateObject = await document.readObject({
                    objectNumber: ref.objectNumber,
                    generationNumber: ref.generationNumber,
                    allowUnindexed: true,
                })
                if (!templateObject) continue

                const stream = templateObject.content.as(PdfStream)
                const xml = new TextDecoder().decode(stream.decode())
                return new PdfXfaTemplate(xml)
            }
        }

        return null
    }
}
