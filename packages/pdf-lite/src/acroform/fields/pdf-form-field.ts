import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfFont } from '../../fonts/pdf-font.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import { decodeWithFontEncoding } from '../../utils/decodeWithFontEncoding.js'
import { PdfWidgetAnnotation } from '../../annotations/pdf-widget-annotation.js'
import { PdfDefaultAppearance } from './pdf-default-appearance.js'
import type { PdfFieldType } from './types.js'
import { PdfFieldType as PdfFieldTypeConst } from './types.js'
import { PdfFormFieldFlags } from './pdf-form-field-flags.js'
import { PdfDefaultResourcesDictionary } from '../../annotations/pdf-default-resources.js'
import type { PdfAcroFormObject } from '../pdf-acro-form.js'

/**
 * Abstract base form field class. Extends PdfWidgetAnnotation with form-specific properties:
 * FT, V, DA, Ff, T (name), field hierarchy (parent/children/siblings).
 * Subclasses must implement generateAppearance().
 */
export abstract class PdfFormField extends PdfWidgetAnnotation {
    defaultGenerateAppearance: boolean = true

    /** @internal */
    _form?: PdfAcroFormObject

    set form(f: PdfAcroFormObject) {
        this._form = f
    }
    constructor(other?: PdfIndirectObject | { form?: PdfAcroFormObject }) {
        super()
        if (other && !(other instanceof PdfIndirectObject)) {
            this._form = other.form
        }
    }

    init() {
        this.defaultGenerateAppearance = true
    }

    static create(other?: PdfIndirectObject): PdfFormField {
        if (!(other?.content instanceof PdfDictionary))
            throw new Error('Invalid form field object')

        const ft = other?.content.get('FT')?.as(PdfName)?.value as
            | 'Sig'
            | 'Btn'
            | 'Tx'
            | 'Ch'
            | undefined

        const cls = ft ? PdfFormField._registry.get(ft) : undefined
        if (!cls) {
            if (PdfFormField._fallbackCtor) {
                return other.becomes(PdfFormField._fallbackCtor)
            }
            throw new Error(`Unsupported form field type: ${ft ?? 'unknown'}`)
        }

        return other.becomes(cls)
    }

    get parent(): PdfFormField | undefined {
        const resolved = this.content.get('Parent')?.resolve()
        if (!resolved || !(resolved.content instanceof PdfDictionary))
            return undefined
        try {
            return PdfFormField.create(resolved)
        } catch {
            // Parent may not have FT — treat it as a generic field wrapper
            return resolved as unknown as PdfFormField
        }
    }

    set parent(field: PdfFormField | PdfIndirectObject | undefined) {
        if (!field) {
            this.content.delete('Parent')
            return
        }

        this.content.set('Parent', field.reference)
        if (field instanceof PdfFormField) {
            field.children = [...field.children, this]
        }
    }

    get children(): PdfFormField[] {
        const kids = this.content.get('Kids')?.items ?? []
        const result: PdfFormField[] = []
        for (const ref of kids) {
            const resolved = ref.resolve()
            if (!resolved || !(resolved.content instanceof PdfDictionary))
                continue
            try {
                result.push(PdfFormField.create(resolved))
            } catch {
                result.push(resolved as unknown as PdfFormField)
            }
        }
        return result
    }

    set children(fields: PdfFormField[]) {
        if (fields.length === 0) {
            this.content.delete('Kids')
            return
        }
        this.content.set('Kids', PdfArray.refs(fields))
        for (const child of fields) {
            child.content.set('Parent', this.reference)
        }
    }

    get siblings(): PdfFormField[] {
        return this.parent?.children ?? []
    }

    get font(): PdfFont | null {
        const fontName = this.fontName
        if (!fontName) return null

        // Try resolving from default resources (DR) dict
        const dr = this.defaultResources
        const fontDict = dr?.get('Font')
        if (fontDict instanceof PdfDictionary) {
            const fontEntry = fontDict.get(fontName)
            if (fontEntry instanceof PdfObjectReference) {
                try {
                    const resolved = fontEntry.resolve()
                    if (resolved?.content instanceof PdfDictionary) {
                        const font = resolved.becomes(PdfFont)
                        font.resourceName = fontName
                        return font
                    }
                } catch {
                    // resolver not wired — fall through to standard fonts
                }
            }
        }

        // Fallback: standard font lookup (Helv, Helvetica, ZaDb, etc.)
        return PdfFont.getStandardFont(fontName) ?? null
    }

    get defaultResources(): PdfDefaultResourcesDictionary | null {
        return (
            this.content.get('DR') ??
            this.parent?.defaultResources ??
            this._form?.defaultResources ??
            null
        )
    }

    set defaultResources(resources: PdfDefaultResourcesDictionary | null) {
        if (resources === null) {
            this.content.delete('DR')
        } else {
            this.content.set('DR', resources)
        }
    }

    get fieldType(): PdfFieldType | null {
        const ft =
            this.content.get('FT')?.as(PdfName)?.value ??
            this.parent?.content.get('FT')?.as(PdfName)?.value
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
            this.content.set('FT', new PdfName(PdfFieldTypeConst[type]))
        }
    }

    get name(): string {
        const parentName = this.parent?.name ?? ''
        const ownName = this.content.get('T')?.as(PdfString)?.value ?? ''
        if (parentName && ownName) {
            return `${parentName}.${ownName}`
        }
        return parentName || ownName
    }

    set name(name: string) {
        this.content.set('T', new PdfString(name))
    }

    get defaultValue(): string {
        const dv = this.content.get('DV') ?? this.parent?.content.get('DV')
        if (dv instanceof PdfString) return dv.value
        if (dv instanceof PdfName) return dv.value
        return ''
    }

    set defaultValue(val: string) {
        this.content.set('DV', new PdfString(val))
    }

    get value(): string {
        const v = this.content.get('V') ?? this.parent?.content.get('V')
        if (v instanceof PdfString) {
            if (v.isUTF16BE) return v.value
            const encodingMap =
                this.font?.encodingMap ??
                (this.fontName
                    ? this._form?.fontEncodingMaps?.get(this.fontName)
                    : undefined)
            if (encodingMap) {
                return decodeWithFontEncoding(v.raw, encodingMap)
            }
            return v.value
        } else if (v instanceof PdfName) {
            return v.value
        }
        return ''
    }

    set value(val: string | PdfString) {
        if (this.value === val) return

        const fieldParent = this.parent?.content.get('FT')
            ? this.parent
            : undefined
        const generateAppearance = this._storeValue(val, fieldParent)
        if (generateAppearance && this.defaultGenerateAppearance) {
            this.tryGenerateAppearance(this)
            for (const sibling of this.siblings) {
                if (
                    sibling !== this &&
                    sibling.rect &&
                    sibling.defaultGenerateAppearance
                ) {
                    this.tryGenerateAppearance(sibling)
                }
            }
        }
    }

    /**
     * Writes the value to the dictionary. Returns true if appearance generation
     * should proceed, false to skip it (e.g. when value was cleared).
     * Override in subclasses to change the stored representation.
     */
    protected _storeValue(
        val: string | PdfString,
        fieldParent: PdfFormField | undefined,
    ): boolean {
        const pdfVal = val instanceof PdfString ? val : new PdfString(val)
        this.content.set('V', pdfVal)
        fieldParent?.content.set('V', pdfVal)
        return true
    }

    protected tryGenerateAppearance(field: PdfFormField): void {
        field.generateAppearance()
    }

    get fontSize(): number | null {
        const da = this.defaultAppearance || ''
        const parsed = PdfDefaultAppearance.parse(da)
        return parsed?.fontSize ?? null
    }

    set fontSize(size: number) {
        const da = this.defaultAppearance || ''
        if (!da) {
            this.content.set('DA', new PdfDefaultAppearance('F1', size, '0 g'))
            return
        }
        const parsed = PdfDefaultAppearance.parse(da)
        if (parsed) {
            parsed.fontSize = size
            this.content.set('DA', parsed)
        }
    }

    get fontName(): string | null {
        const da = this.defaultAppearance || ''
        const parsed = PdfDefaultAppearance.parse(da)
        return parsed?.fontName ?? null
    }

    set fontName(fontName: string) {
        const da = this.defaultAppearance || ''
        if (!da) {
            this.content.set(
                'DA',
                new PdfDefaultAppearance(fontName, 12, '0 g'),
            )
            return
        }
        const parsed = PdfDefaultAppearance.parse(da)
        if (parsed) {
            parsed.fontName = fontName
            this.content.set('DA', parsed)
        }
    }

    set font(font: PdfFont | null) {
        if (font === null) {
            this.content.set('DA', new PdfString(''))
            return
        }
        const resourceName = font.resourceName
        const currentSize = this.fontSize ?? 12
        const da = this.defaultAppearance || ''
        if (!da) {
            this.content.set(
                'DA',
                new PdfDefaultAppearance(resourceName, currentSize, '0 g'),
            )
            return
        }
        const parsed = PdfDefaultAppearance.parse(da)
        if (parsed) {
            parsed.fontName = resourceName
            this.content.set('DA', parsed)
        }
    }

    get flags(): PdfFormFieldFlags {
        const flags = new PdfFormFieldFlags(
            this.content.get('Ff') ?? this.parent?.content.get('Ff') ?? 0,
        )
        flags.onChange(() => {
            this.flags = flags
        })
        return flags
    }

    set flags(v: PdfFormFieldFlags) {
        this.content.set('Ff', v)
    }

    get readOnly(): boolean {
        return this.flags.readOnly
    }

    set readOnly(v: boolean) {
        this.flags.readOnly = v
    }

    get required(): boolean {
        return this.flags.required
    }
    set required(v: boolean) {
        this.flags.required = v
    }

    get multiline(): boolean {
        return this.flags.multiline
    }
    set multiline(v: boolean) {
        this.flags.multiline = v
    }

    get password(): boolean {
        return this.flags.password
    }
    set password(v: boolean) {
        this.flags.password = v
    }

    get comb(): boolean {
        return this.flags.comb
    }

    get combField(): boolean {
        return this.flags.comb
    }
    set combField(v: boolean) {
        this.flags.comb = v
    }

    get combo(): boolean {
        return this.flags.combo
    }
    set combo(v: boolean) {
        this.flags.combo = v
    }

    get radio(): boolean {
        return this.flags.radio
    }
    set radio(v: boolean) {
        this.flags.radio = v
    }

    get noToggleToOff(): boolean {
        return this.flags.noToggleToOff
    }
    set noToggleToOff(v: boolean) {
        this.flags.noToggleToOff = v
    }

    get noExport(): boolean {
        return this.flags.noExport
    }
    set noExport(v: boolean) {
        this.flags.noExport = v
    }

    get pushButton(): boolean {
        return this.flags.pushButton
    }
    set pushButton(v: boolean) {
        this.flags.pushButton = v
    }

    get edit(): boolean {
        return this.flags.edit
    }
    set edit(v: boolean) {
        this.flags.edit = v
    }

    get sort(): boolean {
        return this.flags.sort
    }
    set sort(v: boolean) {
        this.flags.sort = v
    }

    get multiSelect(): boolean {
        return this.flags.multiSelect
    }
    set multiSelect(v: boolean) {
        this.flags.multiSelect = v
    }

    get doNotSpellCheck(): boolean {
        return this.flags.doNotSpellCheck
    }
    set doNotSpellCheck(v: boolean) {
        this.flags.doNotSpellCheck = v
    }

    get doNotScroll(): boolean {
        return this.flags.doNotScroll
    }
    set doNotScroll(v: boolean) {
        this.flags.doNotScroll = v
    }

    get commitOnSelChange(): boolean {
        return this.flags.commitOnSelChange
    }

    set commitOnSelChange(v: boolean) {
        this.flags.commitOnSelChange = v
    }

    get quadding(): number {
        return (
            this.content.get('Q')?.as(PdfNumber)?.value ??
            this.parent?.content.get('Q')?.as(PdfNumber)?.value ??
            0
        )
    }

    set quadding(q: number) {
        this.content.set('Q', new PdfNumber(q))
    }

    get defaultAppearance(): string | null {
        return (
            this.content.get('DA')?.as(PdfString)?.value ??
            this.parent?.defaultAppearance ??
            this._form?.defaultAppearance ??
            null
        )
    }

    set defaultAppearance(da: string) {
        this.content.set('DA', new PdfString(da))
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

    abstract generateAppearance(options?: {
        makeReadOnly?: boolean
        textYOffset?: number
    }): boolean

    setAppearanceStream(
        stream:
            | PdfIndirectObject
            | {
                  [key: string]: PdfIndirectObject
              },
    ) {
        this.appearanceStreamDict ||= new PdfDictionary()
        if (stream instanceof PdfIndirectObject) {
            this.appearanceStreamDict.set('N', stream.reference)
        } else {
            const dict = new PdfDictionary()
            for (const key in stream) {
                dict.set(key, stream[key].reference)
            }
            this.appearanceStreamDict.set('N', dict)
        }
    }

    getAppearanceStream(setting?: string): PdfIndirectObject<PdfStream> | null {
        const n = this.appearanceStreamDict?.get('N')
        if (!n) return null
        if (n instanceof PdfObjectReference) {
            const resolved = n.resolve()
            if (resolved?.content instanceof PdfStream) {
                return resolved as PdfIndirectObject<PdfStream>
            }
        } else if (n instanceof PdfDictionary) {
            const key =
                setting ??
                this.content.get('AS')?.as(PdfName)?.value ??
                undefined
            if (key) {
                const entry = n.get(key)
                if (entry instanceof PdfObjectReference) {
                    const resolved = entry.resolve()
                    if (resolved?.content instanceof PdfStream) {
                        return resolved as PdfIndirectObject<PdfStream>
                    }
                }
            }
        }
        return null
    }

    private static _fallbackCtor?: new (
        other?: PdfIndirectObject,
    ) => PdfFormField

    private static _registry = new Map<
        'Sig' | 'Btn' | 'Tx' | 'Ch',
        new (other?: PdfIndirectObject) => PdfFormField
    >()

    static registerFieldType(
        ft: 'Sig' | 'Btn' | 'Tx' | 'Ch',
        ctor: new (other?: PdfIndirectObject) => PdfFormField,
        options?: { fallback?: boolean },
    ): void {
        PdfFormField._registry.set(ft, ctor)
        if (options?.fallback) {
            PdfFormField._fallbackCtor = ctor
        }
    }
}

/** Backward compatible alias */
export { PdfFormField as PdfAcroFormField }
