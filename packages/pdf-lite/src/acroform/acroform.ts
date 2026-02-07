import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfBoolean } from '../core/objects/pdf-boolean.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfFont } from '../fonts/pdf-font.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import {
    buildEncodingMap,
    decodeWithFontEncoding,
} from '../utils/decodeWithFontEncoding.js'

/**
 * Field types for AcroForm fields
 */
export const PdfFieldType = {
    Text: 'Tx',
    Button: 'Btn',
    Choice: 'Ch',
    Signature: 'Sig',
} as const

export type PdfFieldType = keyof typeof PdfFieldType

export class PdfAcroFormField extends PdfDictionary<{
    FT: PdfName<(typeof PdfFieldType)[keyof typeof PdfFieldType]>
    T?: PdfString
    V?: PdfString | PdfName
    DV?: PdfString | PdfName
    DA?: PdfString
    AS?: PdfName
    Kids?: PdfArray<PdfObjectReference>
    P?: PdfObjectReference
    Rect?: PdfArray<PdfNumber>
    F?: PdfNumber
    Ff?: PdfNumber
    BS?: PdfDictionary
    MK?: PdfDictionary
    Type?: PdfName<'Annot'>
    Subtype?: PdfName<'Widget'>
    AP?: PdfDictionary
    Q?: PdfNumber
    MaxLen?: PdfNumber
    Opt?: PdfArray<PdfString>
}> {
    parent?: PdfAcroFormField
    readonly container?: PdfIndirectObject
    form?: PdfAcroForm
    defaultGenerateAppearance: boolean = true
    private _appearanceStream?: PdfStream
    private _appearanceStreamYes?: PdfStream // For button fields: checked state

    constructor(options?: {
        container?: PdfIndirectObject
        form?: PdfAcroForm
    }) {
        super()
        this.container = options?.container
        this.form = options?.form
    }

    /**
     * Gets the field type
     */
    get fieldType(): PdfFieldType | null {
        const ft = this.get('FT')?.value
        switch (ft) {
            case 'Tx':
                return 'Text'
            case 'Btn':
                return 'Button'
            case 'Ch':
                return 'Choice'
            case 'Sig':
                return 'Signature'
            default:
                return null
        }
    }

    set fieldType(type: PdfFieldType | null) {
        if (type === null) {
            this.delete('FT')
        } else {
            this.set('FT', new PdfName(PdfFieldType[type]))
        }
    }

    get rect(): number[] | null {
        const rectArray = this.get('Rect')?.as(PdfArray<PdfNumber>)
        if (!rectArray) return null
        return rectArray.items.map((num) => num.value)
    }

    set rect(rect: number[] | null) {
        if (rect === null) {
            this.delete('Rect')
            return
        }
        const rectArray = new PdfArray<PdfNumber>(
            rect.map((num) => new PdfNumber(num)),
        )
        this.set('Rect', rectArray)
    }

    get parentRef(): PdfObjectReference | null {
        const ref = this.get('P')?.as(PdfObjectReference)
        return ref ?? null
    }

    set parentRef(ref: PdfObjectReference | null) {
        if (ref === null) {
            this.delete('P')
        } else {
            this.set('P', ref)
        }
    }

    get isWidget(): boolean {
        const type = this.get('Type')?.as(PdfName)?.value
        const subtype = this.get('Subtype')?.as(PdfName)?.value
        return type === 'Annot' && subtype === 'Widget'
    }

    set isWidget(isWidget: boolean) {
        if (isWidget) {
            this.set('Type', new PdfName('Annot'))
            this.set('Subtype', new PdfName('Widget'))
        } else {
            this.delete('Type')
            this.delete('Subtype')
        }
    }

    /**
     * Gets the field name
     */
    get name(): string {
        const parentName = this.parent?.name ?? ''
        const ownName = this.get('T')?.as(PdfString)?.value ?? ''

        if (parentName && ownName) {
            return `${parentName}.${ownName}`
        }

        return parentName || ownName
    }

    /**
     * Sets the field name
     */
    set name(name: string) {
        this.set('T', new PdfString(name))
    }

    /**
     * Gets the default value
     */
    get defaultValue(): string {
        const dv = this.get('DV')
        if (dv instanceof PdfString) {
            return dv.value
        } else if (dv instanceof PdfName) {
            return dv.value
        }
        return ''
    }

    /**
     * Sets the default value
     */
    set defaultValue(val: string) {
        const fieldType = this.fieldType
        if (fieldType === 'Button') {
            this.set('DV', new PdfName(val))
        } else {
            this.set('DV', new PdfString(val))
        }
    }

    get value(): string {
        const v = this.get('V')
        if (v instanceof PdfString) {
            // UTF-16BE strings should always use UTF-16BE decoding regardless of font encoding
            if (v.isUTF16BE) {
                return v.value // Use PdfString's built-in UTF-16BE decoder
            }

            // Try to use custom font encoding if available
            const encodingMap = this.getCachedEncodingMap()
            if (encodingMap !== undefined) {
                return decodeWithFontEncoding(v.raw, encodingMap)
            }
            return v.value
        } else if (v instanceof PdfName) {
            return v.value
        }
        return ''
    }

    /**
     * Gets the cached encoding map for this field's font, if available.
     * Returns undefined if no encoding has been cached yet.
     */
    private getCachedEncodingMap(): Map<number, string> | null | undefined {
        if (!this.form) return undefined

        // Parse font name from DA (default appearance) string
        const da = this.get('DA')?.as(PdfString)?.value
        if (!da) return undefined

        // Extract font name from DA string (format: /FontName size Tf ...)
        const fontMatch = da.match(/\/(\w+)\s+[\d.]+\s+Tf/)
        if (!fontMatch) return undefined

        const fontName = fontMatch[1]
        return this.form.fontEncodingMaps.get(fontName)
    }

    set value(val: string) {
        if (this.value === val) {
            return
        }

        const fieldType = this.fieldType
        if (fieldType === 'Button') {
            if (val.trim() === '') {
                this.delete('V')
                this.delete('AS')
                return
            }
            this.set('V', new PdfName(val))
            this.set('AS', new PdfName(val))
        } else {
            this.set('V', new PdfString(val))
        }

        if (this.defaultGenerateAppearance) {
            this.generateAppearance()
        }
    }

    get checked(): boolean {
        if (this.fieldType === 'Button') {
            const v = this.get('V')
            return v instanceof PdfName && v.value === 'Yes'
        }
        return false
    }

    set checked(isChecked: boolean) {
        if (this.fieldType === 'Button') {
            if (isChecked) {
                this.set('V', new PdfName('Yes'))
                this.set('AS', new PdfName('Yes'))
            } else {
                this.set('V', new PdfName('Off'))
                this.set('AS', new PdfName('Off'))
            }
        }
    }

    get fontSize(): number | null {
        const da = this.get('DA')?.as(PdfString)?.value || ''
        const match = da.match(/\/[A-Za-z0-9_-]+\s+([\d.]+)\s+Tf/)
        if (match) {
            return parseFloat(match[1])
        }
        return null
    }

    set fontSize(size: number) {
        const da = this.get('DA')?.as(PdfString)?.value || ''
        if (!da) {
            this.set('DA', new PdfString(`/F1 ${size} Tf 0 g`))
            return
        }
        const updatedDa = da.replace(
            /(\/[A-Za-z0-9_-]+)\s+[\d.]+\s+Tf/g,
            `$1 ${size} Tf`,
        )
        this.set('DA', new PdfString(updatedDa))
    }

    get fontName(): string | null {
        const da = this.get('DA')?.as(PdfString)?.value || ''
        const match = da.match(/\/([A-Za-z0-9_-]+)\s+[\d.]+\s+Tf/)
        if (match) {
            return match[1]
        }
        return null
    }

    set fontName(fontName: string) {
        const da = this.get('DA')?.as(PdfString)?.value || ''
        if (!da) {
            this.set('DA', new PdfString(`/${fontName} 12 Tf 0 g`))
            return
        }
        const updatedDa = da.replace(
            /\/[A-Za-z0-9_-]+(\s+[\d.]+\s+Tf)/g,
            `/${fontName}$1`,
        )
        this.set('DA', new PdfString(updatedDa))
    }

    /**
     * Sets the font using a PdfFont object.
     * Pass null to clear the font.
     */
    set font(font: PdfFont | null) {
        if (font === null) {
            // Clear font - set to empty or default
            this.set('DA', new PdfString(''))
            return
        }

        const resourceName = font.resourceName
        const currentSize = this.fontSize ?? 12
        const da = this.get('DA')?.as(PdfString)?.value || ''

        if (!da) {
            this.set(
                'DA',
                new PdfString(`/${resourceName} ${currentSize} Tf 0 g`),
            )
            return
        }

        const updatedDa = da.replace(
            /\/[A-Za-z0-9_-]+(\s+[\d.]+\s+Tf)/g,
            `/${resourceName}$1`,
        )
        this.set('DA', new PdfString(updatedDa))
    }

    /**
     * Gets field flags (bitwise combination of field attributes)
     */
    get flags(): number {
        return this.get('Ff')?.as(PdfNumber)?.value ?? 0
    }

    /**
     * Sets field flags
     */
    set flags(flags: number) {
        this.set('Ff', new PdfNumber(flags))
    }

    /**
     * Checks if the field is read-only
     */
    get readOnly(): boolean {
        return (this.flags & 1) !== 0
    }

    /**
     * Sets the field as read-only or editable
     */
    set readOnly(isReadOnly: boolean) {
        if (isReadOnly) {
            this.flags = this.flags | 1
        } else {
            this.flags = this.flags & ~1
        }
    }

    /**
     * Checks if the field is required
     */
    get required(): boolean {
        return (this.flags & 2) !== 0
    }

    /**
     * Sets the field as required or optional
     */
    set required(isRequired: boolean) {
        if (isRequired) {
            this.flags = this.flags | 2
        } else {
            this.flags = this.flags & ~2
        }
    }

    /**
     * Checks if the field is multiline (for text fields)
     */
    get multiline(): boolean {
        return (this.flags & 4096) !== 0
    }

    /**
     * Sets the field as multiline (for text fields)
     */
    set multiline(isMultiline: boolean) {
        if (isMultiline) {
            this.flags = this.flags | 4096
        } else {
            this.flags = this.flags & ~4096
        }
    }

    /**
     * Checks if the field is a password field (for text fields)
     */
    get password(): boolean {
        return (this.flags & 8192) !== 0
    }

    /**
     * Sets the field as a password field (for text fields)
     */
    set password(isPassword: boolean) {
        if (isPassword) {
            this.flags = this.flags | 8192
        } else {
            this.flags = this.flags & ~8192
        }
    }

    /**
     * Checks if the field is a comb field (characters distributed evenly across cells)
     */
    get comb(): boolean {
        return (this.flags & 16777216) !== 0
    }

    /**
     * Gets the quadding (text alignment) for this field.
     * 0 = left-justified, 1 = centered, 2 = right-justified
     */
    get quadding(): number {
        return this.get('Q')?.as(PdfNumber)?.value ?? 0
    }

    /**
     * Sets the quadding (text alignment) for this field.
     * 0 = left-justified, 1 = centered, 2 = right-justified
     */
    set quadding(q: number) {
        this.set('Q', new PdfNumber(q))
    }

    /**
     * Gets the options for choice fields (dropdowns, list boxes).
     * Returns an array of option strings.
     */
    get options(): string[] {
        const opt = this.get('Opt')?.as(PdfArray<PdfString>)
        if (!opt) return []
        return opt.items.map((item) => item.value)
    }

    /**
     * Sets the options for choice fields (dropdowns, list boxes).
     * Pass an array of strings.
     */
    set options(options: string[]) {
        if (options.length === 0) {
            this.delete('Opt')
            return
        }
        const optArray = new PdfArray<PdfString>(
            options.map((opt) => new PdfString(opt)),
        )
        this.set('Opt', optArray)
    }

    get defaultAppearance(): string | null {
        return this.get('DA')?.as(PdfString)?.value ?? null
    }

    set defaultAppearance(da: string) {
        this.set('DA', new PdfString(da))
    }

    set combo(isCombo: boolean) {
        if (isCombo) {
            this.flags = this.flags | 131072
        } else {
            this.flags = this.flags & ~131072
        }
    }

    get combo(): boolean {
        return (this.flags & 131072) !== 0
    }

    get radio(): boolean {
        return (this.flags & 32768) !== 0
    }

    set radio(isRadio: boolean) {
        if (isRadio) {
            this.flags = this.flags | 32768
        } else {
            this.flags = this.flags & ~32768
        }
    }

    get noToggleToOff(): boolean {
        return (this.flags & 16384) !== 0
    }

    set noToggleToOff(noToggle: boolean) {
        if (noToggle) {
            this.flags = this.flags | 16384
        } else {
            this.flags = this.flags & ~16384
        }
    }

    get combField(): boolean {
        return (this.flags & 16777216) !== 0
    }

    set combField(isComb: boolean) {
        if (isComb) {
            this.flags = this.flags | 16777216
        } else {
            this.flags = this.flags & ~16777216
        }
    }

    get maxLen(): number | null {
        return this.get('MaxLen')?.as(PdfNumber)?.value ?? null
    }

    set maxLen(maxLen: number | null) {
        if (maxLen === null) {
            this.delete('MaxLen')
        } else {
            this.set('MaxLen', new PdfNumber(maxLen))
        }
    }

    /**
     * Generates an appearance stream for a text field using iText's approach.
     *
     * This generates an appearance with text using the same positioning formula as iText:
     * - textY = (height - fontSize) / 2 + fontSize * 0.2
     * - Wrapped in marked content blocks (/Tx BMC ... EMC)
     * - Field remains editable unless makeReadOnly is set
     *
     * For editable fields (default, no options):
     * - Text visible immediately
     * - Field remains fully editable
     * - No save dialog (needAppearances = false)
     * - Text positioning matches iText
     *
     * For read-only fields (makeReadOnly: true):
     * - Same appearance generation
     * - Field is set as read-only
     *
     * @param options.makeReadOnly - If true, sets field as read-only
     * @returns true if appearance was generated successfully
     */
    generateAppearance(options?: {
        makeReadOnly?: boolean
        textYOffset?: number
    }): boolean {
        const fieldType = this.fieldType

        // Route to appropriate generation method based on field type
        if (fieldType === 'Text') {
            return this.generateTextAppearance(options)
        } else if (fieldType === 'Button') {
            return this.generateButtonAppearance(options)
        } else if (fieldType === 'Choice') {
            return this.generateChoiceAppearance(options)
        }

        return false
    }

    /**
     * Generates appearance for text fields
     * @internal
     */
    private generateTextAppearance(options?: {
        makeReadOnly?: boolean
        textYOffset?: number
    }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        // Get the default appearance string
        const da = this.get('DA')?.as(PdfString)?.value
        if (!da) return false

        // Get the field value
        const value = this.value

        // Parse font name and size from DA
        const fontMatch = da.match(/\/(\w+)\s+([\d.]+)\s+Tf/)
        if (!fontMatch) return false

        const fontName = fontMatch[1]
        let fontSize = parseFloat(fontMatch[2])

        // If font size is 0 or invalid, use a default size
        if (!fontSize || fontSize <= 0) {
            fontSize = 12 // Default to 12pt
        }

        // Parse color from DA (format: "r g b rg" or "g g")
        let colorOp = '0 g' // default to black
        const rgMatch = da.match(/([\d.]+\s+[\d.]+\s+[\d.]+)\s+rg/)
        const gMatch = da.match(/([\d.]+)\s+g/)
        if (rgMatch) {
            colorOp = `${rgMatch[1]} rg`
        } else if (gMatch) {
            colorOp = `${gMatch[1]} g`
        }

        // Reconstruct the DA string with the correct font size
        const reconstructedDA = `/${fontName} ${fontSize} Tf ${colorOp}`

        // Calculate text position using Adobe Acrobat's positioning formula
        // After testing, this formula matches Acrobat's rendering most closely
        const padding = 2

        // Vertical positioning: Position baseline to match viewer behavior
        // This accounts for the font's typical metrics (cap height, descenders, etc.)
        const textY = (height - fontSize) / 2 + fontSize * 0.2

        // Escape special characters in the text value
        const escapedValue = value
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')

        // Generate text positioning based on field type
        let textContent: string

        if (this.multiline) {
            // Multiline text field: handle line breaks
            const lines = value.split('\n')
            const lineHeight = fontSize * 1.2
            const startY = height - padding - fontSize

            textContent = 'BT\n'
            textContent += `${reconstructedDA}\n`
            textContent += `${padding} ${startY} Td\n`

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                    .replace(/\\/g, '\\\\')
                    .replace(/\(/g, '\\(')
                    .replace(/\)/g, '\\)')
                    .replace(/\r/g, '')

                if (i > 0) {
                    textContent += `0 ${-lineHeight} Td\n`
                }
                textContent += `(${line}) Tj\n`
            }

            textContent += 'ET\n'
        } else if (this.comb && this.maxLen) {
            // Comb field: position each character in its own cell
            const cellWidth = width / this.maxLen
            const chars = value.split('')

            textContent = 'BT\n'
            textContent += `${reconstructedDA}\n`

            for (let i = 0; i < chars.length && i < this.maxLen; i++) {
                // Center each character in its cell
                const cellX = cellWidth * i + cellWidth / 2 - fontSize * 0.3
                const escapedChar = chars[i]
                    .replace(/\\/g, '\\\\')
                    .replace(/\(/g, '\\(')
                    .replace(/\)/g, '\\)')

                textContent += `${cellX} ${textY} Td\n`
                textContent += `(${escapedChar}) Tj\n`
                textContent += `${-cellX} ${-textY} Td\n` // Reset position
            }

            textContent += 'ET\n'
        } else {
            // Regular text field
            const textX = padding
            textContent = `BT
${reconstructedDA}
${textX} ${textY} Td
(${escapedValue}) Tj
ET
`
        }

        // Generate appearance with text (iText approach)
        // Use marked content to properly tag the text field content
        const contentStream = `/Tx BMC
q
${textContent}Q
EMC
`

        // Create the appearance stream
        const appearanceDict = new PdfDictionary()
        appearanceDict.set('Type', new PdfName('XObject'))
        appearanceDict.set('Subtype', new PdfName('Form'))
        appearanceDict.set('FormType', new PdfNumber(1))
        appearanceDict.set(
            'BBox',
            new PdfArray([
                new PdfNumber(0),
                new PdfNumber(0),
                new PdfNumber(width),
                new PdfNumber(height),
            ]),
        )

        // Set up resources with the font from the form's default resources
        // We need to copy the fonts, not just reference them, to ensure Acrobat can find them
        if (this.form) {
            const formResources = this.form.get('DR')?.as(PdfDictionary)
            if (formResources) {
                const fonts = formResources.get('Font')?.as(PdfDictionary)
                if (fonts) {
                    // Clone the fonts dictionary to ensure it's independent
                    const resources = new PdfDictionary()
                    resources.set('Font', fonts.clone())
                    appearanceDict.set('Resources', resources)
                } else {
                    // If no fonts in DR, try to use the entire DR as Resources
                    appearanceDict.set('Resources', formResources.clone())
                }
            }
        }

        const stream = new PdfStream({
            header: appearanceDict,
            original: contentStream,
        })

        // Store the appearance stream for later writing
        this._appearanceStream = stream

        // Configure field flags based on options
        if (options?.makeReadOnly) {
            // Set the read-only flag (Ff bit 0)
            this.readOnly = true

            // Ensure the annotation is visible and printable (F flag bits 2 and 3)
            const currentF = this.get('F')?.as(PdfNumber)?.value ?? 0
            this.set('F', new PdfNumber(currentF | 4 | 8)) // Print (4) + NoZoom (8)
        } else {
            // For editable fields, just ensure print flag is set
            const currentF = this.get('F')?.as(PdfNumber)?.value ?? 0
            this.set('F', new PdfNumber(currentF | 4)) // Print (4)
        }

        return true
    }

    /**
     * Generates appearance for button fields (checkboxes, radio buttons)
     * @internal
     */
    private generateButtonAppearance(options?: {
        makeReadOnly?: boolean
    }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1
        const size = Math.min(width, height)

        // Check if this is a radio button by looking at parent/siblings
        // Radio buttons typically have Ff bit 15 (Radio) set
        const isRadio = (this.flags & 32768) !== 0

        // Helper to create appearance stream dictionary
        const createAppearanceStream = (content: string) => {
            const appearanceDict = new PdfDictionary()
            appearanceDict.set('Type', new PdfName('XObject'))
            appearanceDict.set('Subtype', new PdfName('Form'))
            appearanceDict.set('FormType', new PdfNumber(1))
            appearanceDict.set(
                'BBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(width),
                    new PdfNumber(height),
                ]),
            )

            // Add ZapfDingbats font for checkmarks
            const resources = new PdfDictionary()
            const fonts = new PdfDictionary()
            const zapfFont = new PdfDictionary()
            zapfFont.set('Type', new PdfName('Font'))
            zapfFont.set('Subtype', new PdfName('Type1'))
            zapfFont.set('BaseFont', new PdfName('ZapfDingbats'))
            fonts.set('ZaDb', zapfFont)
            resources.set('Font', fonts)
            appearanceDict.set('Resources', resources)

            return new PdfStream({
                header: appearanceDict,
                original: content,
            })
        }

        // Generate "Off" state appearance (unchecked/empty)
        const offStream = createAppearanceStream('')

        // Generate "Yes" state appearance (checked)
        let yesContent: string
        if (isRadio) {
            // Radio button: filled circle using 4 Bezier curves to approximate a circle
            const center = size / 2
            const radius = size * 0.35
            const k = 0.5522847498 // Magic number for circular Bezier curves (4/3 * tan(π/8))
            const kRadius = k * radius

            // Draw a filled circle using 4 cubic Bezier curves
            yesContent = `q
0 0 0 rg
${center} ${center + radius} m
${center + kRadius} ${center + radius} ${center + radius} ${center + kRadius} ${center + radius} ${center} c
${center + radius} ${center - kRadius} ${center + kRadius} ${center - radius} ${center} ${center - radius} c
${center - kRadius} ${center - radius} ${center - radius} ${center - kRadius} ${center - radius} ${center} c
${center - radius} ${center + kRadius} ${center - kRadius} ${center + radius} ${center} ${center + radius} c
f
Q
`
        } else {
            // Checkbox: checkmark (using ZapfDingbats character)
            const checkSize = size * 0.8
            const offset = (size - checkSize) / 2
            yesContent = `q
BT
/ZaDb ${checkSize} Tf
${offset} ${offset} Td
(4) Tj
ET
Q
`
        }
        const yesStream = createAppearanceStream(yesContent)

        // Store both appearance streams in a state dictionary
        // We'll use a special structure to hold both states
        this._appearanceStream = offStream // Store Off as default
        this._appearanceStreamYes = yesStream // Store Yes state separately

        if (options?.makeReadOnly) {
            this.readOnly = true
            const currentF = this.get('F')?.as(PdfNumber)?.value ?? 0
            this.set('F', new PdfNumber(currentF | 4 | 8))
        }

        return true
    }

    /**
     * Generates appearance for choice fields (dropdowns, list boxes)
     * @internal
     */
    private generateChoiceAppearance(options?: {
        makeReadOnly?: boolean
    }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        // Get the default appearance string
        const da = this.get('DA')?.as(PdfString)?.value
        if (!da) return false

        const value = this.value
        if (!value) return false

        // Parse font and size from DA
        const fontMatch = da.match(/\/(\w+)\s+([\d.]+)\s+Tf/)
        if (!fontMatch) return false

        const fontName = fontMatch[1]
        let fontSize = parseFloat(fontMatch[2])
        if (!fontSize || fontSize <= 0) {
            fontSize = 12
        }

        const colorOp = '0 g'
        const reconstructedDA = `/${fontName} ${fontSize} Tf ${colorOp}`

        const padding = 2
        const textY = (height - fontSize) / 2 + fontSize * 0.2
        const textX = padding

        const escapedValue = value
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')

        // Check if this is a combo box (dropdown) - Ff bit 17 (131072)
        const isCombo = (this.flags & 131072) !== 0

        // Draw dropdown arrow for combo boxes
        let arrowGraphics = ''
        if (isCombo) {
            // Reserve space for the arrow on the right
            const arrowWidth = height * 0.8 // Arrow area width
            const arrowX = width - arrowWidth - 2 // X position for arrow
            const arrowY = height / 2 // Y center
            const arrowSize = height * 0.3 // Triangle size

            // Draw a small downward-pointing triangle
            arrowGraphics = `
q
0.5 0.5 0.5 rg
${arrowX + arrowWidth / 2} ${arrowY - arrowSize / 3} m
${arrowX + arrowWidth / 2 - arrowSize / 2} ${arrowY + arrowSize / 3} l
${arrowX + arrowWidth / 2 + arrowSize / 2} ${arrowY + arrowSize / 3} l
f
Q
`
        }

        // Generate appearance with text and optional dropdown arrow
        const contentStream = `/Tx BMC
q
BT
${reconstructedDA}
${textX} ${textY} Td
(${escapedValue}) Tj
ET
${arrowGraphics}Q
EMC
`

        const appearanceDict = new PdfDictionary()
        appearanceDict.set('Type', new PdfName('XObject'))
        appearanceDict.set('Subtype', new PdfName('Form'))
        appearanceDict.set('FormType', new PdfNumber(1))
        appearanceDict.set(
            'BBox',
            new PdfArray([
                new PdfNumber(0),
                new PdfNumber(0),
                new PdfNumber(width),
                new PdfNumber(height),
            ]),
        )

        if (this.form) {
            const formResources = this.form.get('DR')?.as(PdfDictionary)
            if (formResources) {
                const fonts = formResources.get('Font')?.as(PdfDictionary)
                if (fonts) {
                    const resources = new PdfDictionary()
                    resources.set('Font', fonts.clone())
                    appearanceDict.set('Resources', resources)
                }
            }
        }

        const stream = new PdfStream({
            header: appearanceDict,
            original: contentStream,
        })

        this._appearanceStream = stream

        if (options?.makeReadOnly) {
            this.readOnly = true
            const currentF = this.get('F')?.as(PdfNumber)?.value ?? 0
            this.set('F', new PdfNumber(currentF | 4 | 8))
        }

        return true
    }

    /**
     * Gets the stored appearance stream if one has been generated.
     * For button fields, returns the appropriate stream based on the current state.
     * @internal
     */
    getAppearanceStream(): PdfStream | undefined {
        // For button fields, return the appropriate stream based on state
        if (this.fieldType === 'Button') {
            if (this.checked && this._appearanceStreamYes) {
                return this._appearanceStreamYes
            }
            return this._appearanceStream // Return "Off" state
        }
        return this._appearanceStream
    }

    /**
     * Gets all appearance streams for writing to PDF.
     * For button fields, returns both Off and Yes states.
     * For other fields, returns just the primary appearance.
     * @internal
     */
    getAppearanceStreamsForWriting():
        | {
              primary: PdfStream
              secondary?: PdfStream
          }
        | undefined {
        if (!this._appearanceStream) return undefined

        return {
            primary: this._appearanceStream,
            secondary:
                this.fieldType === 'Button'
                    ? this._appearanceStreamYes
                    : undefined,
        }
    }

    /**
     * Sets the appearance dictionary reference for this field.
     * @internal - This is called automatically by PdfAcroForm.write()
     */
    setAppearanceReference(
        appearanceStreamRef: PdfObjectReference,
        appearanceStreamYesRef?: PdfObjectReference,
    ): void {
        let apDict = this.get('AP')?.as(PdfDictionary)
        if (!apDict) {
            apDict = new PdfDictionary()
            this.set('AP', apDict)
        }

        // For button fields with multiple states, create a state dictionary
        if (appearanceStreamYesRef && this.fieldType === 'Button') {
            const stateDict = new PdfDictionary()
            stateDict.set('Off', appearanceStreamRef)
            stateDict.set('Yes', appearanceStreamYesRef)
            apDict.set('N', stateDict)
        } else {
            // For other fields, set the appearance stream directly
            apDict.set('N', appearanceStreamRef)
        }
    }
}

export class PdfAcroForm<
    T extends Record<string, string> = Record<string, string>,
> extends PdfDictionary<{
    Fields: PdfArray<PdfObjectReference>
    NeedAppearances?: PdfBoolean
    SigFlags?: PdfNumber
    CO?: PdfArray<PdfObjectReference>
    DR?: PdfDictionary
    DA?: PdfString
    Q?: PdfNumber
}> {
    fields: PdfAcroFormField[]
    readonly container?: PdfIndirectObject
    readonly fontEncodingMaps: Map<string, Map<number, string> | null> =
        new Map()
    private document?: PdfDocument

    constructor(options: {
        dict: PdfDictionary
        fields?: PdfAcroFormField[]
        container?: PdfIndirectObject
        document?: PdfDocument
    }) {
        super()
        this.copyFrom(options.dict)
        this.fields = options.fields ?? []
        this.container = options.container
        this.document = options.document
    }

    /**
     * Gets the NeedAppearances flag
     */
    get needAppearances(): boolean {
        return this.get('NeedAppearances')?.as(PdfBoolean)?.value ?? false
    }

    /**
     * Sets the NeedAppearances flag to indicate that appearance streams need to be regenerated
     */
    set needAppearances(value: boolean) {
        this.set('NeedAppearances', new PdfBoolean(value))
    }

    /**
     * Gets the signature flags
     */
    get signatureFlags(): number {
        return this.get('SigFlags')?.as(PdfNumber)?.value ?? 0
    }

    /**
     * Sets the signature flags
     */
    set signatureFlags(flags: number) {
        this.set('SigFlags', new PdfNumber(flags))
    }

    /**
     * Gets the default appearance string for the form
     */
    get defaultAppearance(): string | null {
        return this.get('DA')?.as(PdfString)?.value ?? null
    }

    /**
     * Sets the default appearance string for the form
     */
    set defaultAppearance(da: string) {
        this.set('DA', new PdfString(da))
    }

    /**
     * Gets the default quadding (alignment) for the form
     * 0 = left, 1 = center, 2 = right
     */
    get defaultQuadding(): number {
        return this.get('Q')?.as(PdfNumber)?.value ?? 0
    }

    /**
     * Sets the default quadding (alignment) for the form
     */
    set defaultQuadding(q: number) {
        this.set('Q', new PdfNumber(q))
    }

    /**
     * Sets multiple field values by field name.
     * @param values Object with field names as keys and values to set
     * */
    setValues(values: Partial<T>): void {
        for (const field of this.fields) {
            const name = field.name
            if (name in values && values[name] !== undefined) {
                field.value = values[name]
            }
        }
    }

    importData(fields: T): void {
        for (const field of this.fields) {
            const name = field.name
            if (name && name in fields) {
                field.value = fields[name]
            }
        }
    }

    exportData(): Partial<T> {
        const result: any = {}
        for (const field of this.fields) {
            const name = field.name
            if (name) {
                result[name] = field.value
            }
        }
        return result
    }

    /**
     * Gets the encoding map for a specific font in the form's resources.
     * Returns null if no custom encoding is found.
     * Results are cached for performance.
     */
    async getFontEncodingMap(
        fontName: string,
    ): Promise<Map<number, string> | null> {
        // Check cache first
        if (this.fontEncodingMaps.has(fontName)) {
            return this.fontEncodingMaps.get(fontName)!
        }

        // Get the font from DR (default resources)
        const dr = this.get('DR')?.as(PdfDictionary)
        if (!dr) {
            this.fontEncodingMaps.set(fontName, null)
            return null
        }

        const fonts = dr.get('Font')?.as(PdfDictionary)
        if (!fonts) {
            this.fontEncodingMaps.set(fontName, null)
            return null
        }

        const fontRef = fonts.get(fontName)?.as(PdfObjectReference)
        if (!fontRef || !this.document) {
            this.fontEncodingMaps.set(fontName, null)
            return null
        }

        // Read the font object
        const fontObj = await this.document.readObject({
            objectNumber: fontRef.objectNumber,
            generationNumber: fontRef.generationNumber,
        })

        if (!fontObj) {
            this.fontEncodingMaps.set(fontName, null)
            return null
        }

        const fontDict = fontObj.content.as(PdfDictionary)
        const encoding = fontDict.get('Encoding')

        // Handle encoding reference
        let encodingDict: PdfDictionary | null = null
        if (encoding instanceof PdfObjectReference) {
            const encodingObj = await this.document.readObject({
                objectNumber: encoding.objectNumber,
                generationNumber: encoding.generationNumber,
            })
            encodingDict = encodingObj?.content.as(PdfDictionary) ?? null
        } else if (encoding instanceof PdfDictionary) {
            encodingDict = encoding
        }

        if (!encodingDict) {
            this.fontEncodingMaps.set(fontName, null)
            return null
        }

        // Parse the Differences array
        const differences = encodingDict.get('Differences')?.as(PdfArray)
        if (!differences) {
            this.fontEncodingMaps.set(fontName, null)
            return null
        }

        const encodingMap = buildEncodingMap(differences)
        this.fontEncodingMaps.set(fontName, encodingMap)
        return encodingMap
    }

    static async fromDocument(
        document: PdfDocument,
    ): Promise<PdfAcroForm | null> {
        const catalog = document.rootDictionary
        if (!catalog) return null

        const acroFormRef = catalog.get('AcroForm')
        if (!acroFormRef) return null

        let acroFormDict: PdfDictionary
        let acroFormContainer: PdfIndirectObject | undefined

        if (acroFormRef instanceof PdfObjectReference) {
            const acroFormObject = await document.readObject({
                objectNumber: acroFormRef.objectNumber,
                generationNumber: acroFormRef.generationNumber,
            })

            if (!acroFormObject) return null
            if (!(acroFormObject.content instanceof PdfDictionary))
                throw new Error('AcroForm content must be a dictionary')

            acroFormDict = acroFormObject.content
            acroFormContainer = acroFormObject
        } else if (acroFormRef instanceof PdfDictionary) {
            acroFormDict = acroFormRef
        } else {
            return null
        }

        const acroForm = new PdfAcroForm({
            dict: acroFormDict,
            container: acroFormContainer,
            document,
        })

        const fields: Map<string, PdfAcroFormField> = new Map()

        const getFields = async (
            fieldRefs: PdfArray<PdfObjectReference>,
            parent?: PdfAcroFormField,
        ): Promise<void> => {
            for (const fieldRef of fieldRefs.items) {
                const refKey = fieldRef.toString().trim()
                if (fields.has(refKey)) {
                    fields.get(refKey)!.parent = parent
                    continue
                }

                const fieldObject = await document.readObject({
                    objectNumber: fieldRef.objectNumber,
                    generationNumber: fieldRef.generationNumber,
                })

                if (!fieldObject) continue
                if (!(fieldObject.content instanceof PdfDictionary)) continue

                const field = new PdfAcroFormField({
                    container: fieldObject,
                    form: acroForm,
                })
                field.parent = parent
                field.copyFrom(fieldObject.content)

                // Process child fields (Kids) before adding the parent
                const kids = field.get('Kids')?.as(PdfArray<PdfObjectReference>)
                if (kids) {
                    await getFields(kids, field)
                }

                acroForm.fields.push(field)

                fields.set(refKey, field)
            }
        }

        const fieldsArray: PdfArray<PdfObjectReference> = new PdfArray()
        if (acroForm.get('Fields') instanceof PdfArray) {
            fieldsArray.items.push(
                ...acroForm.get('Fields')!.as(PdfArray<PdfObjectReference>)
                    .items,
            )
        } else if (acroForm.get('Fields') instanceof PdfObjectReference) {
            const fieldsObj = await document.readObject({
                objectNumber: acroForm.get('Fields')!.as(PdfObjectReference)
                    .objectNumber,
                generationNumber: acroForm.get('Fields')!.as(PdfObjectReference)
                    .generationNumber,
            })

            if (fieldsObj && fieldsObj.content instanceof PdfArray) {
                fieldsArray.items.push(
                    ...fieldsObj.content.as(PdfArray<PdfObjectReference>).items,
                )
            }
        }

        await getFields(fieldsArray)

        // Pre-cache font encoding maps for all fonts used in fields
        await acroForm.cacheAllFontEncodings()

        return acroForm
    }

    /**
     * Pre-caches encoding maps for all fonts used in the form fields.
     * This makes subsequent field value access faster and synchronous.
     */
    private async cacheAllFontEncodings(): Promise<void> {
        const fontNames = new Set<string>()

        // Collect all font names from field DA strings
        for (const field of this.fields) {
            const da = field.get('DA')?.as(PdfString)?.value
            if (da) {
                const fontMatch = da.match(/\/(\w+)\s+[\d.]+\s+Tf/)
                if (fontMatch) {
                    fontNames.add(fontMatch[1])
                }
            }
        }

        // Pre-cache encoding for each font
        for (const fontName of fontNames) {
            await this.getFontEncodingMap(fontName)
        }
    }

    /**
     * Gets or creates the Annots array for a page.
     * Returns the array and metadata about whether it's an indirect object.
     */
    private async getPageAnnotsArray(
        document: PdfDocument,
        pageDict: PdfDictionary,
    ): Promise<{
        annotsArray: PdfArray<PdfObjectReference>
        isIndirect: boolean
        objectNumber?: number
        generationNumber?: number
    }> {
        const annotsRef = pageDict.get('Annots')

        if (annotsRef instanceof PdfObjectReference) {
            const annotsObj = await document.readObject({
                objectNumber: annotsRef.objectNumber,
                generationNumber: annotsRef.generationNumber,
            })
            return {
                annotsArray: annotsObj!.content
                    .as(PdfArray<PdfObjectReference>)
                    .clone(),
                isIndirect: true,
                objectNumber: annotsRef.objectNumber,
                generationNumber: annotsRef.generationNumber,
            }
        } else if (annotsRef instanceof PdfArray) {
            return {
                annotsArray: annotsRef.as(PdfArray<PdfObjectReference>).clone(),
                isIndirect: false,
            }
        } else {
            const newArray = new PdfArray<PdfObjectReference>()
            pageDict.set('Annots', newArray)
            return {
                annotsArray: newArray,
                isIndirect: false,
            }
        }
    }

    /**
     * Adds field references to a page's Annots array, avoiding duplicates.
     */
    private addFieldsToAnnots(
        annotsArray: PdfArray<PdfObjectReference>,
        fieldRefs: PdfObjectReference[],
    ): void {
        for (const fieldRef of fieldRefs) {
            const exists = annotsArray.items.some((ref) => ref.equals(fieldRef))
            if (!exists) {
                annotsArray.push(fieldRef)
            }
        }
    }

    /**
     * Updates page annotations to include new form field references.
     */
    private async updatePageAnnotations(
        document: PdfDocument,
        fieldsByPage: Map<
            string,
            {
                pageRef: PdfObjectReference
                fieldRefs: PdfObjectReference[]
            }
        >,
    ): Promise<void> {
        for (const { pageRef, fieldRefs } of fieldsByPage.values()) {
            const pageObj = await document.readObject({
                objectNumber: pageRef.objectNumber,
                generationNumber: pageRef.generationNumber,
            })

            if (!pageObj) continue

            const pageDict = pageObj.content.as(PdfDictionary).clone()
            const annotsInfo = await this.getPageAnnotsArray(document, pageDict)

            this.addFieldsToAnnots(annotsInfo.annotsArray, fieldRefs)

            // Write the Annots array if it's an indirect object
            if (
                annotsInfo.isIndirect &&
                annotsInfo.objectNumber !== undefined
            ) {
                const annotsIndirect = new PdfIndirectObject({
                    objectNumber: annotsInfo.objectNumber,
                    generationNumber: annotsInfo.generationNumber!,
                    content: annotsInfo.annotsArray,
                })
                document.add(annotsIndirect)
            }

            // Write the modified page
            const pageIndirect = new PdfIndirectObject({
                objectNumber: pageRef.objectNumber,
                generationNumber: pageRef.generationNumber,
                content: pageDict,
            })
            document.add(pageIndirect)
        }
    }

    async write(document: PdfDocument) {
        const catalog = document.rootDictionary?.clone()
        if (!catalog) {
            throw new Error('Document has no root catalog')
        }

        const isIncremental = document.isIncremental()
        document.setIncremental(true)

        const fieldsArray = new PdfArray<PdfObjectReference>()
        this.set('Fields', fieldsArray)

        // Track fields that need to be added to page annotations
        const fieldsByPage = new Map<
            string,
            {
                pageRef: PdfObjectReference
                fieldRefs: PdfObjectReference[]
            }
        >()

        for (const field of this.fields) {
            let fieldReference: PdfObjectReference | undefined

            if (field.isModified()) {
                // If the field has generated appearance streams, create them as indirect objects
                const appearances = field.getAppearanceStreamsForWriting()
                if (appearances) {
                    // Create the primary appearance stream
                    const primaryAppearanceObj = new PdfIndirectObject({
                        content: appearances.primary,
                    })
                    document.add(primaryAppearanceObj)

                    // Create the secondary appearance stream if present (for button fields)
                    let secondaryAppearanceRef: PdfObjectReference | undefined
                    if (appearances.secondary) {
                        const secondaryAppearanceObj = new PdfIndirectObject({
                            content: appearances.secondary,
                        })
                        document.add(secondaryAppearanceObj)
                        secondaryAppearanceRef =
                            secondaryAppearanceObj.reference
                    }

                    // Set the appearance references on the field
                    field.setAppearanceReference(
                        primaryAppearanceObj.reference,
                        secondaryAppearanceRef,
                    )

                    // Ensure field has the Print flag set (bit 2)
                    // This ensures the appearance is used for display and printing
                    const currentF = field.get('F')?.as(PdfNumber)?.value ?? 0
                    if ((currentF & 4) === 0) {
                        field.set('F', new PdfNumber(currentF | 4))
                    }
                }

                // Write modified field as an indirect object
                const acroFormFieldIndirect = new PdfIndirectObject({
                    objectNumber: field.container?.objectNumber,
                    generationNumber: field.container?.generationNumber,
                    content: field,
                })
                document.add(acroFormFieldIndirect)

                // Create a proper PdfObjectReference (not the proxy from .reference)
                fieldReference = new PdfObjectReference(
                    acroFormFieldIndirect.objectNumber,
                    acroFormFieldIndirect.generationNumber,
                )

                // Track if this field needs to be added to a page's Annots
                const parentRef = field.parentRef
                const isWidget = field.isWidget
                if (parentRef && isWidget) {
                    const pageKey = `${parentRef.objectNumber}_${parentRef.generationNumber}`
                    if (!fieldsByPage.has(pageKey)) {
                        fieldsByPage.set(pageKey, {
                            pageRef: parentRef,
                            fieldRefs: [],
                        })
                    }
                    fieldsByPage.get(pageKey)!.fieldRefs.push(fieldReference)
                }
            } else {
                // Unmodified field: reuse existing indirect reference information
                const container = field.container
                if (container) {
                    fieldReference = new PdfObjectReference(
                        container.objectNumber,
                        container.generationNumber,
                    )
                }
            }

            if (fieldReference) {
                fieldsArray.push(fieldReference)
            }
        }

        // Add field references to page annotations
        await this.updatePageAnnotations(document, fieldsByPage)

        if (this.isModified()) {
            // Create or update the AcroForm entry in the catalog
            const acroFormIndirect = new PdfIndirectObject({
                objectNumber: this.container?.objectNumber,
                generationNumber: this.container?.generationNumber,
                content: this,
            })
            document.add(acroFormIndirect)
            catalog.set('AcroForm', acroFormIndirect.reference)

            // In incremental mode, ensure the updated catalog is written
            const rootRef = document.trailerDict
                .get('Root')
                ?.as(PdfObjectReference)
            if (rootRef) {
                const rootIndirect = new PdfIndirectObject({
                    objectNumber: rootRef.objectNumber,
                    generationNumber: rootRef.generationNumber,
                    content: catalog,
                })
                document.add(rootIndirect)
            }
        }

        await document.commit()
        document.setIncremental(isIncremental)
    }
}
