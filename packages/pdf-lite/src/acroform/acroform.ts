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

export type PdfAppearanceStreamDictionary = PdfDictionary<{
    /** Appearance streams for different states */
    N: PdfObjectReference | PdfDictionary
    /* Optional appearance streams for button fields (e.g. checkboxes) */
    R?: PdfObjectReference | PdfDictionary
    /* Optional appearance stream for "on" state of button fields (e.g. checked state) */
    D?: PdfObjectReference | PdfDictionary
}>

export type PdfDefaultResourcesDictionary = PdfDictionary<{
    /** Font resources used in the form */
    Font?: PdfDictionary
    /** Procedure sets */
    ProcSet?: PdfArray
    /** Extended graphics states */
    ExtGState?: PdfDictionary
    /** Color spaces */
    ColorSpace?: PdfDictionary
    /** Patterns */
    Pattern?: PdfDictionary
    /** Shading dictionaries */
    Shading?: PdfDictionary
    /** External objects */
    XObject?: PdfDictionary
}>

export class PdfAcroFormField extends PdfIndirectObject<
    PdfDictionary<{
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
        AP?: PdfAppearanceStreamDictionary
        Q?: PdfNumber
        MaxLen?: PdfNumber
        Opt?: PdfArray<PdfString>
    }>
> {
    private _parent?: PdfAcroFormField
    defaultGenerateAppearance: boolean = true
    private _appearanceStream?: PdfStream
    private _appearanceStreamYes?: PdfStream // For button fields: checked state
    private form?: PdfAcroForm

    constructor(options?: { other?: PdfIndirectObject; form?: PdfAcroForm }) {
        super(
            options?.other ??
                new PdfIndirectObject({ content: new PdfDictionary() }),
        )
        this.form = options?.form
    }

    get parent(): PdfAcroFormField | undefined {
        if (this._parent) return this._parent
        if (!this.form) return undefined
        return this.form.fields.find(
            (f) =>
                f !== this &&
                f.kids.some(
                    (k) =>
                        k.objectNumber === this.objectNumber &&
                        k.generationNumber === this.generationNumber,
                ),
        )
    }

    set parent(field: PdfAcroFormField | undefined) {
        // Remove from old parent's Kids
        if (this._parent) {
            this._parent.kids = this._parent.kids.filter(
                (k) =>
                    k.objectNumber !== this.objectNumber ||
                    k.generationNumber !== this.generationNumber,
            )
        }
        this._parent = field
        // Add to new parent's Kids
        if (field) {
            const alreadyInKids = field.kids.some(
                (k) =>
                    k.objectNumber === this.objectNumber &&
                    k.generationNumber === this.generationNumber,
            )
            if (!alreadyInKids) {
                field.kids = [...field.kids, this.reference]
            }
        }
    }

    get children(): PdfAcroFormField[] {
        if (!this.form) return []
        return this.form.fields.filter((f) => f.parent === this)
    }

    set children(fields: PdfAcroFormField[]) {
        // Clear existing children's parent
        for (const child of this.children) {
            child._parent = undefined
        }
        // Set new children and update Kids array
        this.kids = fields.map((f) => f.reference)
        for (const child of fields) {
            child._parent = this
        }
    }

    get siblings(): PdfAcroFormField[] {
        return this.parent?.children ?? []
    }

    get encodingMap(): Map<number, string> | undefined {
        const fontName = this.fontName
        if (!fontName) return undefined
        return this.form?.fontEncodingMaps?.get(fontName)
    }

    /**
     * Convenience method to check if field dictionary is modified
     */
    isModified(): boolean {
        return this.content.isModified()
    }

    /**
     * Gets the field type
     */
    get fieldType(): PdfFieldType | null {
        const ft =
            this.content.get('FT')?.value ??
            this.parent?.content.get('FT')?.value
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
            this.content.delete('FT')
        } else {
            this.content.set('FT', new PdfName(PdfFieldType[type]))
        }
    }

    get rect(): number[] | null {
        const rectArray = this.content.get('Rect')?.as(PdfArray<PdfNumber>)
        if (!rectArray) return null
        return rectArray.items.map((num) => num.value)
    }

    set rect(rect: number[] | null) {
        if (rect === null) {
            this.content.delete('Rect')
            return
        }
        const rectArray = new PdfArray<PdfNumber>(
            rect.map((num) => new PdfNumber(num)),
        )
        this.content.set('Rect', rectArray)
    }

    get parentRef(): PdfObjectReference | null {
        const ref = this.content.get('P')?.as(PdfObjectReference)
        return ref ?? null
    }

    set parentRef(ref: PdfObjectReference | null) {
        if (ref === null) {
            this.content.delete('P')
        } else {
            this.content.set('P', ref)
        }
    }

    get isWidget(): boolean {
        const type = this.content.get('Type')?.as(PdfName)?.value
        const subtype = this.content.get('Subtype')?.as(PdfName)?.value
        return type === 'Annot' && subtype === 'Widget'
    }

    set isWidget(isWidget: boolean) {
        if (isWidget) {
            this.content.set('Type', new PdfName('Annot'))
            this.content.set('Subtype', new PdfName('Widget'))
        } else {
            this.content.delete('Type')
            this.content.delete('Subtype')
        }
    }

    /**
     * Gets the field name
     */
    get name(): string {
        const parentName = this.parent?.name ?? ''
        const ownName = this.content.get('T')?.as(PdfString)?.value ?? ''

        if (parentName && ownName) {
            return `${parentName}.${ownName}`
        }

        return parentName || ownName
    }

    /**
     * Sets the field name
     */
    set name(name: string) {
        this.content.set('T', new PdfString(name))
    }

    /**
     * Gets the default value
     */
    get defaultValue(): string {
        const dv = this.content.get('DV') ?? this.parent?.content.get('DV')
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
            this.content.set('DV', new PdfName(val))
        } else {
            this.content.set('DV', new PdfString(val))
        }
    }

    get value(): string {
        // V may be on this field or inherited from parent (parent/kids split)
        const v = this.content.get('V') ?? this.parent?.content.get('V')
        if (v instanceof PdfString) {
            // UTF-16BE strings should always use UTF-16BE decoding regardless of font encoding
            if (v.isUTF16BE) {
                return v.value // Use PdfString's built-in UTF-16BE decoder
            }

            if (this.encodingMap) {
                return decodeWithFontEncoding(v.raw, this.encodingMap)
            }
            return v.value
        } else if (v instanceof PdfName) {
            return v.value
        }
        return ''
    }

    set value(val: string | PdfString) {
        if (this.value === val) {
            return
        }

        // In a parent/kids split, V should be set on the parent field
        const target = this.parent ?? this
        const fieldType = this.fieldType
        if (fieldType === 'Button') {
            val = val instanceof PdfString ? val.value : val
            if (val.trim() === '') {
                target.content.delete('V')
                this.content.delete('AS')
                return
            }
            target.content.set('V', new PdfName(val))
            this.content.set('AS', new PdfName(val))
        } else {
            target.content.set(
                'V',
                val instanceof PdfString ? val : new PdfString(val),
            )
        }

        if (this.defaultGenerateAppearance) {
            this.generateAppearance()

            // If this is a child widget with siblings, regenerate their appearances too
            for (const sibling of this.siblings) {
                if (
                    sibling !== this &&
                    sibling.rect &&
                    sibling.defaultGenerateAppearance
                ) {
                    sibling.generateAppearance()
                }
            }
        }
    }

    get checked(): boolean {
        if (this.fieldType === 'Button') {
            const v = this.content.get('V') ?? this.parent?.content.get('V')
            return v instanceof PdfName && v.value === 'Yes'
        }
        return false
    }

    set checked(isChecked: boolean) {
        if (this.fieldType === 'Button') {
            const target = this.parent ?? this
            if (isChecked) {
                target.content.set('V', new PdfName('Yes'))
                this.content.set('AS', new PdfName('Yes'))
            } else {
                target.content.set('V', new PdfName('Off'))
                this.content.set('AS', new PdfName('Off'))
            }
        }
    }

    get fontSize(): number | null {
        const da = this.defaultAppearance || ''
        const match = da.match(/\/[A-Za-z0-9_-]+\s+([\d.]+)\s+Tf/)
        if (match) {
            return parseFloat(match[1])
        }
        return null
    }

    set fontSize(size: number) {
        const da = this.defaultAppearance || ''
        if (!da) {
            this.content.set('DA', new PdfString(`/F1 ${size} Tf 0 g`))
            return
        }
        const updatedDa = da.replace(
            /(\/[A-Za-z0-9_-]+)\s+[\d.]+\s+Tf/g,
            `$1 ${size} Tf`,
        )
        this.content.set('DA', new PdfString(updatedDa))
    }

    get fontName(): string | null {
        const da = this.defaultAppearance || ''
        const match = da.match(/\/([A-Za-z0-9_-]+)\s+[\d.]+\s+Tf/)
        if (match) {
            return match[1]
        }
        return null
    }

    set fontName(fontName: string) {
        const da = this.defaultAppearance || ''
        if (!da) {
            this.content.set('DA', new PdfString(`/${fontName} 12 Tf 0 g`))
            return
        }
        const updatedDa = da.replace(
            /\/[A-Za-z0-9_-]+(\s+[\d.]+\s+Tf)/g,
            `/${fontName}$1`,
        )
        this.content.set('DA', new PdfString(updatedDa))
    }

    /**
     * Sets the font using a PdfFont object.
     * Pass null to clear the font.
     */
    set font(font: PdfFont | null) {
        if (font === null) {
            // Clear font - set to empty or default
            this.content.set('DA', new PdfString(''))
            return
        }

        const resourceName = font.resourceName
        const currentSize = this.fontSize ?? 12
        const da = this.defaultAppearance || ''

        if (!da) {
            this.content.set(
                'DA',
                new PdfString(`/${resourceName} ${currentSize} Tf 0 g`),
            )
            return
        }

        const updatedDa = da.replace(
            /\/[A-Za-z0-9_-]+(\s+[\d.]+\s+Tf)/g,
            `/${resourceName}$1`,
        )
        this.content.set('DA', new PdfString(updatedDa))
    }

    /**
     * Gets field flags (bitwise combination of field attributes)
     */
    get flags(): number {
        return (
            this.content.get('Ff')?.as(PdfNumber)?.value ??
            this.parent?.content.get('Ff')?.as(PdfNumber)?.value ??
            0
        )
    }

    /**
     * Sets field flags
     */
    set flags(flags: number) {
        this.content.set('Ff', new PdfNumber(flags))
    }

    /**
     * Gets annotation flags (for visual appearance and behavior)
     */
    get annotationFlags(): number {
        return this.content.get('F')?.as(PdfNumber)?.value ?? 0
    }

    /**
     * Sets annotation flags
     */
    set annotationFlags(flags: number) {
        this.content.set('F', new PdfNumber(flags))
    }

    /**
     * Checks if the field is read-only (Ff bit 1)
     */
    get readOnly(): boolean {
        return (this.flags & 1) !== 0
    }

    /**
     * Sets the field as read-only or editable (Ff bit 1)
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
        return (
            this.content.get('Q')?.as(PdfNumber)?.value ??
            this.parent?.content.get('Q')?.as(PdfNumber)?.value ??
            0
        )
    }

    /**
     * Sets the quadding (text alignment) for this field.
     * 0 = left-justified, 1 = centered, 2 = right-justified
     */
    set quadding(q: number) {
        this.content.set('Q', new PdfNumber(q))
    }

    /**
     * Gets the options for choice fields (dropdowns, list boxes).
     * Returns an array of option strings.
     */
    get options(): string[] {
        const opt =
            this.content.get('Opt')?.as(PdfArray<PdfString>) ??
            this.parent?.content.get('Opt')?.as(PdfArray<PdfString>)
        if (!opt) return []
        return opt.items.map((item) => item.value)
    }

    /**
     * Sets the options for choice fields (dropdowns, list boxes).
     * Pass an array of strings.
     */
    set options(options: string[]) {
        if (options.length === 0) {
            this.content.delete('Opt')
            return
        }
        const optArray = new PdfArray<PdfString>(
            options.map((opt) => new PdfString(opt)),
        )
        this.content.set('Opt', optArray)
    }

    get defaultAppearance(): string | null {
        return (
            this.content.get('DA')?.as(PdfString)?.value ??
            this.parent?.content.get('DA')?.as(PdfString)?.value ??
            null
        )
    }

    set defaultAppearance(da: string) {
        this.content.set('DA', new PdfString(da))
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
        return this.content.get('MaxLen')?.as(PdfNumber)?.value ?? null
    }

    set maxLen(maxLen: number | null) {
        if (maxLen === null) {
            this.content.delete('MaxLen')
        } else {
            this.content.set('MaxLen', new PdfNumber(maxLen))
        }
    }

    // ============================================
    // Annotation Flags (F field)
    // ============================================

    /**
     * If true, the annotation is invisible (F bit 1)
     */
    get invisible(): boolean {
        return (this.annotationFlags & 1) !== 0
    }

    set invisible(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 1
        } else {
            this.annotationFlags = this.annotationFlags & ~1
        }
    }

    /**
     * If true, the annotation is hidden (F bit 2)
     */
    get hidden(): boolean {
        return (this.annotationFlags & 2) !== 0
    }

    set hidden(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 2
        } else {
            this.annotationFlags = this.annotationFlags & ~2
        }
    }

    /**
     * If true, print the annotation when printing (F bit 3)
     */
    get print(): boolean {
        return (this.annotationFlags & 4) !== 0
    }

    set print(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 4
        } else {
            this.annotationFlags = this.annotationFlags & ~4
        }
    }

    /**
     * If true, do not zoom annotation when zooming (F bit 4)
     */
    get noZoom(): boolean {
        return (this.annotationFlags & 8) !== 0
    }

    set noZoom(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 8
        } else {
            this.annotationFlags = this.annotationFlags & ~8
        }
    }

    /**
     * If true, do not rotate annotation when rotating (F bit 5)
     */
    get noRotate(): boolean {
        return (this.annotationFlags & 16) !== 0
    }

    set noRotate(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 16
        } else {
            this.annotationFlags = this.annotationFlags & ~16
        }
    }

    /**
     * If true, do not display annotation on screen (F bit 6)
     */
    get noView(): boolean {
        return (this.annotationFlags & 32) !== 0
    }

    set noView(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 32
        } else {
            this.annotationFlags = this.annotationFlags & ~32
        }
    }

    /**
     * If true, annotation is locked (F bit 8)
     */
    get locked(): boolean {
        return (this.annotationFlags & 128) !== 0
    }

    set locked(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 128
        } else {
            this.annotationFlags = this.annotationFlags & ~128
        }
    }

    // ============================================
    // Field Flags (Ff field) - Additional
    // ============================================

    /**
     * If true, field value should not be exported (Ff bit 3)
     */
    get noExport(): boolean {
        return (this.flags & 4) !== 0
    }

    set noExport(value: boolean) {
        if (value) {
            this.flags = this.flags | 4
        } else {
            this.flags = this.flags & ~4
        }
    }

    /**
     * If true, field is a pushbutton (Ff bit 17)
     */
    get pushButton(): boolean {
        return (this.flags & 65536) !== 0
    }

    set pushButton(value: boolean) {
        if (value) {
            this.flags = this.flags | 65536
        } else {
            this.flags = this.flags & ~65536
        }
    }

    /**
     * If true, text field allows editing (Ff bit 19)
     */
    get edit(): boolean {
        return (this.flags & 262144) !== 0
    }

    set edit(value: boolean) {
        if (value) {
            this.flags = this.flags | 262144
        } else {
            this.flags = this.flags & ~262144
        }
    }

    /**
     * If true, choice options should be sorted alphabetically (Ff bit 20)
     */
    get sort(): boolean {
        return (this.flags & 524288) !== 0
    }

    set sort(value: boolean) {
        if (value) {
            this.flags = this.flags | 524288
        } else {
            this.flags = this.flags & ~524288
        }
    }

    /**
     * If true, allows multiple selections in choice field (Ff bit 22)
     */
    get multiSelect(): boolean {
        return (this.flags & 2097152) !== 0
    }

    set multiSelect(value: boolean) {
        if (value) {
            this.flags = this.flags | 2097152
        } else {
            this.flags = this.flags & ~2097152
        }
    }

    /**
     * If true, do not spell check this field (Ff bit 23)
     */
    get doNotSpellCheck(): boolean {
        return (this.flags & 4194304) !== 0
    }

    set doNotSpellCheck(value: boolean) {
        if (value) {
            this.flags = this.flags | 4194304
        } else {
            this.flags = this.flags & ~4194304
        }
    }

    /**
     * If true, do not scroll text field (Ff bit 24)
     */
    get doNotScroll(): boolean {
        return (this.flags & 8388608) !== 0
    }

    set doNotScroll(value: boolean) {
        if (value) {
            this.flags = this.flags | 8388608
        } else {
            this.flags = this.flags & ~8388608
        }
    }

    /**
     * If true, commit field value immediately on selection change (Ff bit 27)
     */
    get commitOnSelChange(): boolean {
        return (this.flags & 67108864) !== 0
    }

    set commitOnSelChange(value: boolean) {
        if (value) {
            this.flags = this.flags | 67108864
        } else {
            this.flags = this.flags & ~67108864
        }
    }

    get kids(): PdfObjectReference[] {
        const kidsArray = this.content
            .get('Kids')
            ?.as(PdfArray<PdfObjectReference>)
        if (!kidsArray) return []
        return kidsArray.items
    }

    set kids(kids: PdfObjectReference[]) {
        if (kids.length === 0) {
            this.content.delete('Kids')
            return
        }
        const kidsArray = new PdfArray<PdfObjectReference>(kids)
        this.content.set('Kids', kidsArray)
    }

    get appearanceStreamDict(): PdfAppearanceStreamDictionary | null {
        const apDict = this.content.get('AP')?.as(PdfDictionary)
        if (!apDict) return null
        return apDict
    }

    set appearanceStreamDict(dict: PdfAppearanceStreamDictionary | null) {
        if (dict === null) {
            this.content.delete('AP')
            return
        }
        this.content.set('AP', dict)
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

        // Get the default appearance string (may be inherited from parent)
        const da =
            this.content.get('DA')?.as(PdfString)?.value ??
            this.parent?.content.get('DA')?.as(PdfString)?.value
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

        // Add font resources so Acrobat can resolve the font name.
        // Prefer the field's own DR (which has correctly resolved refs in incremental updates),
        // then fall back to the AcroForm-level DR.
        const fieldDR = (this.content as PdfDictionary)
            .get('DR')
            ?.as(PdfDictionary)
        const acroformDR = this.form?.defaultResources
        const fontSource =
            fieldDR?.get('Font')?.as(PdfDictionary) ??
            acroformDR?.get('Font')?.as(PdfDictionary)
        if (fontSource && fontName) {
            const fontRef = fontSource.get(fontName)
            if (fontRef) {
                const resourceFontDict = new PdfDictionary()
                resourceFontDict.set(fontName, fontRef)
                const resourcesDict = new PdfDictionary()
                resourcesDict.set('Font', resourceFontDict)
                appearanceDict.set('Resources', resourcesDict)
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

            // Ensure the annotation is visible and printable
            this.print = true
            this.noZoom = true
        } else {
            // For editable fields, just ensure print flag is set
            this.print = true
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
            this.print = true
            this.noZoom = true
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

        // Get the default appearance string (may be inherited from parent)
        const da =
            this.content.get('DA')?.as(PdfString)?.value ??
            this.parent?.content.get('DA')?.as(PdfString)?.value
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

        // Add font resources so Acrobat can resolve the font name.
        const fieldDR = (this.content as PdfDictionary)
            .get('DR')
            ?.as(PdfDictionary)
        const acroformDR = this.form?.defaultResources
        const fontSource =
            fieldDR?.get('Font')?.as(PdfDictionary) ??
            acroformDR?.get('Font')?.as(PdfDictionary)
        if (fontSource && fontName) {
            const fontRef = fontSource.get(fontName)
            if (fontRef) {
                const resourceFontDict = new PdfDictionary()
                resourceFontDict.set(fontName, fontRef)
                const resourcesDict = new PdfDictionary()
                resourcesDict.set('Font', resourceFontDict)
                appearanceDict.set('Resources', resourcesDict)
            }
        }

        const stream = new PdfStream({
            header: appearanceDict,
            original: contentStream,
        })

        this._appearanceStream = stream

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
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
        let apDict = this.appearanceStreamDict
        if (!apDict) {
            apDict = new PdfDictionary()
            this.appearanceStreamDict = apDict
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
> extends PdfIndirectObject<
    PdfDictionary<{
        Fields: PdfArray<PdfObjectReference>
        NeedAppearances?: PdfBoolean
        SigFlags?: PdfNumber
        CO?: PdfArray<PdfObjectReference>
        DR?: PdfDefaultResourcesDictionary
        DA?: PdfString
        Q?: PdfNumber
    }>
> {
    fields: PdfAcroFormField[]
    readonly fontEncodingMaps: Map<string, Map<number, string>> = new Map()
    private document?: PdfDocument

    constructor(options?: {
        other?: PdfIndirectObject
        fields?: PdfAcroFormField[]
        document?: PdfDocument
    }) {
        super(
            options?.other ??
                new PdfIndirectObject({
                    content: new PdfDictionary(),
                }),
        )
        this.fields = options?.fields ?? []
        this.document = options?.document
    }

    /**
     * Convenience method to get a value from the form dictionary
     */
    get(key: string): any {
        return this.content.get(key as any)
    }

    /**
     * Convenience method to set a value in the form dictionary
     */
    set(key: string, value: any): void {
        this.content.set(key as any, value)
    }

    /**
     * Convenience method to delete a key from the form dictionary
     */
    delete(key: string): void {
        this.content.delete(key as any)
    }

    /**
     * Convenience method to check if form dictionary is modified
     */
    isModified(): boolean {
        return this.content.isModified()
    }

    /**
     * Gets the NeedAppearances flag
     */
    get needAppearances(): boolean {
        return (
            this.content.get('NeedAppearances')?.as(PdfBoolean)?.value ?? false
        )
    }

    /**
     * Sets the NeedAppearances flag to indicate that appearance streams need to be regenerated
     */
    set needAppearances(value: boolean) {
        this.content.set('NeedAppearances', new PdfBoolean(value))
    }

    /**
     * Gets the signature flags
     */
    get signatureFlags(): number {
        return this.content.get('SigFlags')?.as(PdfNumber)?.value ?? 0
    }

    /**
     * Sets the signature flags
     */
    set signatureFlags(flags: number) {
        this.content.set('SigFlags', new PdfNumber(flags))
    }

    /**
     * Gets the default appearance string for the form
     */
    get defaultAppearance(): string | null {
        return this.content.get('DA')?.as(PdfString)?.value ?? null
    }

    /**
     * Sets the default appearance string for the form
     */
    set defaultAppearance(da: string) {
        this.content.set('DA', new PdfString(da))
    }

    /**
     * Gets the default quadding (alignment) for the form
     * 0 = left, 1 = center, 2 = right
     */
    get defaultQuadding(): number {
        return this.content.get('Q')?.as(PdfNumber)?.value ?? 0
    }

    /**
     * Sets the default quadding (alignment) for the form
     */
    set defaultQuadding(q: number) {
        this.content.set('Q', new PdfNumber(q))
    }

    /**
     * Gets the default resources dictionary for the form
     */
    get defaultResources(): PdfDefaultResourcesDictionary | null {
        return this.content.get('DR')?.as(PdfDictionary) ?? null
    }

    /**
     * Sets the default resources dictionary for the form
     */
    set defaultResources(resources: PdfDefaultResourcesDictionary | null) {
        if (resources === null) {
            this.content.delete('DR')
        } else {
            this.content.set('DR', resources)
        }
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

        // Get the font from default resources
        const dr = this.defaultResources
        if (!dr) {
            return null
        }

        const fonts = dr.get('Font')?.as(PdfDictionary)
        if (!fonts) {
            return null
        }

        const fontRef = fonts.get(fontName)?.as(PdfObjectReference)
        if (!fontRef || !this.document) {
            return null
        }

        // Read the font object
        const fontObj = await this.document.readObject({
            objectNumber: fontRef.objectNumber,
            generationNumber: fontRef.generationNumber,
        })

        if (!fontObj) {
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
            return null
        }

        // Parse the Differences array
        const differences = encodingDict.get('Differences')?.as(PdfArray)
        if (!differences) {
            return null
        }

        const encodingMap = buildEncodingMap(differences)
        if (!encodingMap) {
            return null
        }
        this.fontEncodingMaps.set(fontName, encodingMap)
        return encodingMap
    }

    static async fromDocument(
        document: PdfDocument,
    ): Promise<PdfAcroForm | null> {
        const catalog = document.root
        if (!catalog) return null

        const acroFormRef = catalog.content.get('AcroForm')
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
            acroFormContainer = new PdfIndirectObject({ content: acroFormDict })
        } else {
            return null
        }

        const acroForm = new PdfAcroForm({ other: acroFormContainer, document })

        // Pre-cache font encoding maps for all fonts used in fields
        await acroForm.cacheAllFontEncodings()

        const fields: Map<string, PdfAcroFormField> = new Map()

        const getFields = async (
            fieldRefs: PdfObjectReference[],
            parent?: PdfAcroFormField,
        ): Promise<void> => {
            for (const fieldRef of fieldRefs) {
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
                    other: fieldObject,
                    form: acroForm,
                })
                field.parent = parent

                // Process child fields (Kids) before adding the parent
                const kids = field.kids
                if (kids.length > 0) {
                    await getFields(kids, field)
                }

                acroForm.fields.push(field)

                fields.set(refKey, field)
            }
        }

        const fieldsArray: PdfArray<PdfObjectReference> = new PdfArray()
        if (acroForm.content.get('Fields') instanceof PdfArray) {
            fieldsArray.items.push(
                ...acroForm.content
                    .get('Fields')!
                    .as(PdfArray<PdfObjectReference>).items,
            )
        } else if (
            acroForm.content.get('Fields') instanceof PdfObjectReference
        ) {
            const fieldsObj = await document.readObject({
                objectNumber: acroForm.content
                    .get('Fields')!
                    .as(PdfObjectReference).objectNumber,
                generationNumber: acroForm.content
                    .get('Fields')!
                    .as(PdfObjectReference).generationNumber,
            })

            if (fieldsObj && fieldsObj.content instanceof PdfArray) {
                fieldsArray.items.push(
                    ...fieldsObj.content.as(PdfArray<PdfObjectReference>).items,
                )
            }
        }

        await getFields(fieldsArray.items)

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
            const da = field.content.get('DA')?.as(PdfString)?.value
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
        const catalog = document.root

        const isIncremental = document.isIncremental()
        document.setIncremental(true)

        const fieldsArray = new PdfArray<PdfObjectReference>()
        this.content.set('Fields', fieldsArray)

        // Track fields that need to be added to page annotations
        const fieldsByPage = new Map<
            string,
            {
                pageRef: PdfObjectReference
                fieldRefs: PdfObjectReference[]
            }
        >()

        for (const field of this.fields) {
            let fieldReference: PdfObjectReference

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

                    // Ensure field has the Print flag set
                    // This ensures the appearance is used for display and printing
                    if (!field.print) {
                        field.print = true
                    }
                }

                document.add(field)

                // Create a proper PdfObjectReference (not the proxy from .reference)
                fieldReference = new PdfObjectReference(
                    field.objectNumber,
                    field.generationNumber,
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
                fieldReference = field.reference
            }

            fieldsArray.push(fieldReference)
        }

        // Add field references to page annotations
        await this.updatePageAnnotations(document, fieldsByPage)

        if (this.isModified()) {
            document.add(this)

            if (!catalog.content.has('AcroForm')) {
                let updatableCatalog = catalog
                if (catalog.isImmutable()) {
                    updatableCatalog = catalog.clone()
                    document.add(updatableCatalog)
                }
                updatableCatalog.content.set('AcroForm', this.reference)
            }
        }

        await document.commit()
        document.setIncremental(isIncremental)
    }
}
