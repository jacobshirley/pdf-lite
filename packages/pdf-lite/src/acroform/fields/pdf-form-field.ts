import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfFont } from '../../fonts/pdf-font.js'
import type { FontFamily } from '../../fonts/font-family.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import { decodeWithFontEncoding } from '../../utils/decodeWithFontEncoding.js'
import { PdfWidgetAnnotation } from '../../annotations/pdf-widget-annotation.js'
import { PdfDefaultAppearance } from './pdf-default-appearance.js'
import type { PdfFieldType } from './types.js'
import { PdfFieldType as PdfFieldTypeConst } from './types.js'
import { PdfFormFieldFlags } from './pdf-form-field-flags.js'
import { PdfDefaultResourcesDictionary } from '../../annotations/pdf-default-resources.js'
import type { PdfAcroForm } from '../pdf-acro-form.js'
import { PdfFieldActions } from '../js/pdf-field-actions.js'
import { PdfJavaScriptAction } from '../js/pdf-javascript-action.js'
import { parseMarkdownSegments } from '../../utils/parse-markdown-segments.js'

/**
 * Abstract base form field class. Extends PdfWidgetAnnotation with form-specific properties:
 * FT, V, DA, Ff, T (name), field hierarchy (parent/children/siblings).
 * Subclasses must implement generateAppearance().
 */
export abstract class PdfFormField extends PdfWidgetAnnotation {
    defaultGenerateAppearance: boolean = true

    /** Raw markdown string set by markdownValue; cleared by setRawValue. */
    protected _markdownValue?: string

    private _fontFamily?: FontFamily

    /** @internal */
    _form?: PdfAcroForm
    constructor(other?: PdfIndirectObject | { form?: PdfAcroForm }) {
        super()
        if (other && !(other instanceof PdfIndirectObject)) {
            this._form = other.form
        }
    }

    set form(f: PdfAcroForm) {
        this._form = f
    }

    static getFieldType(
        other: PdfIndirectObject,
    ): 'Btn' | 'Sig' | 'Tx' | 'Ch' | null {
        if (!(other.content instanceof PdfDictionary)) return null
        const ft = other.content.get('FT')?.as(PdfName)?.value
        if (ft) return ft
        const parentRef = other.content.get('Parent')
        if (parentRef instanceof PdfObjectReference) {
            const parentResolved = parentRef.resolve()
            if (parentResolved?.content instanceof PdfDictionary) {
                return (
                    parentResolved.content.get('FT')?.as(PdfName)?.value ?? null
                )
            }
        }
        return null
    }

    static create(other?: PdfIndirectObject): PdfFormField {
        if (!(other?.content instanceof PdfDictionary))
            throw new Error('Invalid form field object')

        const ft = PdfFormField.getFieldType(other)
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
        return PdfFormField.create(resolved)
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

        // Auto-add widget to page's Annots array
        const page = this.page
        if (page) {
            const annots = page.annotations
            const widget = this
            const alreadyPresent = annots.items.some((r) => {
                if (!(r instanceof PdfObjectReference)) return false
                try {
                    return r.resolve() === widget
                } catch {
                    return false
                }
            })
            if (!alreadyPresent) {
                annots.items.push(this.reference)
            }
        }
    }

    get children(): PdfFormField[] {
        const kids = this.content.get('Kids')?.items ?? []
        const result: PdfFormField[] = []
        for (const ref of kids) {
            const resolved = ref.resolve()
            result.push(PdfFormField.create(resolved))
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
        return (this.parent?.children ?? []).filter((sib) => sib !== this)
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
                const resolved = fontEntry.resolve()
                if (resolved?.content instanceof PdfDictionary) {
                    const font = resolved.becomes(PdfFont)
                    font.resourceName = fontName
                    return font
                }
            }
        }

        // Fallback: standard font lookup (Helv, Helvetica, ZaDb, etc.)
        return PdfFont.getStandardFont(fontName) ?? null
    }

    get defaultResources(): PdfDefaultResourcesDictionary | null {
        const dr = this.content.get('DR')
        const drDict =
            dr instanceof PdfObjectReference ? dr.resolve()?.content : dr
        return (
            (drDict instanceof PdfDictionary ? drDict : null) ??
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

    /**
     * Builds a Resources dictionary containing the font entry for `fontName`,
     * resolved from DR (handling indirect references) or from a loaded font.
     * Returns undefined if neither source provides the font.
     */
    buildFontResources(fontName: string): PdfDictionary | undefined {
        const dr = this.defaultResources
        const fontRaw = dr?.get('Font')
        let drFontDict: PdfDictionary | undefined
        if (fontRaw instanceof PdfObjectReference) {
            const resolved = fontRaw.resolve()?.content
            if (resolved instanceof PdfDictionary) drFontDict = resolved
        } else if (fontRaw instanceof PdfDictionary) {
            drFontDict = fontRaw
        }

        if (drFontDict && drFontDict.get(fontName)) {
            const resFontDict = new PdfDictionary()
            resFontDict.set(fontName, drFontDict.get(fontName)!)
            const resources = new PdfDictionary()
            resources.set('Font', resFontDict)
            return resources
        }

        const font = this.font
        if (font && !PdfFont.getStandardFont(fontName)) {
            const fontDict = new PdfDictionary()
            fontDict.set(fontName, font.reference)
            const resources = new PdfDictionary()
            resources.set('Font', fontDict)
            return resources
        }

        return undefined
    }

    /**
     * Like buildFontResources but includes multiple font names (regular +
     * variant fonts) in a single Resources/Font dictionary. Falls through to
     * buildFontResources when only one name is provided.
     */
    buildAllFontResources(fontNames: string[]): PdfDictionary | undefined {
        if (fontNames.length <= 1) return this.buildFontResources(fontNames[0])

        const dr = this.defaultResources
        const fontRaw = dr?.get('Font')
        let drFontDict: PdfDictionary | undefined
        if (fontRaw instanceof PdfObjectReference) {
            const resolved = fontRaw.resolve()?.content
            if (resolved instanceof PdfDictionary) drFontDict = resolved
        } else if (fontRaw instanceof PdfDictionary) {
            drFontDict = fontRaw
        }

        const resFontDict = new PdfDictionary()
        for (const name of fontNames) {
            if (drFontDict?.get(name)) {
                resFontDict.set(name, drFontDict.get(name)!)
            }
        }

        if (resFontDict.keys().length > 0) {
            const resources = new PdfDictionary()
            resources.set('Font', resFontDict)
            return resources
        }

        // Fallback to single-font path for the primary font name
        return this.buildFontResources(fontNames[0])
    }

    get fieldType(): PdfFieldType | null {
        const ft = PdfFormField.getFieldType(this)
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

    get onStates(): string[] {
        return this.appearanceStates.filter((s) => s !== 'Off')
    }

    get onState(): string | null {
        return this.appearanceStates.find((s) => s !== 'Off') || null
    }

    set onState(state: string) {
        if (!this.appearanceStates.includes(state)) {
            const currentOnState = this.onState
            if (currentOnState) {
                this.appearanceStreamDict
                    ?.get('N')
                    ?.as(PdfDictionary)
                    ?.move(currentOnState, state)
            } else {
                // No existing on-state; generate a new appearance stream for the new state
                this.generateAppearance({ onStateName: state })
            }
        }
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

    protected setRawValue(val: string | PdfString) {
        this._markdownValue = undefined

        const targets: PdfFormField[] = [this]
        const parent = this.parent
        if (parent?.fieldType) {
            targets.push(parent)
        }

        const pdfVal = val instanceof PdfString ? val : new PdfString(val)
        const isEmpty = pdfVal.length === 0

        for (const target of targets) {
            if (isEmpty) {
                target.content.delete('V')
                target.appearanceState = null
            } else {
                target.content.set('V', pdfVal)
            }
        }

        for (const child of this.children) {
            if (child.content.has('V')) {
                child.content.delete('V')
            }
        }

        this._form?.xfa?.datasets?.updateField(this.name, this.value)

        this.updateAppearance()
    }

    updateAppearance(cache: Set<PdfIndirectObject> = new Set()): void {
        if (cache.has(this)) return
        cache.add(this)

        if (this.defaultGenerateAppearance) {
            this.generateAppearance()
        }

        for (const sibling of this.siblings) {
            sibling.updateAppearance(cache)
        }

        // Separated field/widget structure: field has no Rect but its Kids
        // are widget annotations that do. Clear stale V entries on children
        // so they inherit the parent's value, then generate appearances.
        for (const child of this.children) {
            if (this._form) child.form = this._form
            child.updateAppearance(cache)
        }
    }

    set value(val: string | PdfString) {
        this.setRawValue(val)
    }

    get markdownValue(): string | undefined {
        return this._markdownValue ?? this.parent?._markdownValue
    }

    set markdownValue(val: string) {
        const plainText = parseMarkdownSegments(val)
            .map((s) => s.text)
            .join('')

        // Store plain text as V without triggering appearance generation yet
        const saved = this.defaultGenerateAppearance
        this.defaultGenerateAppearance = false
        this.setRawValue(plainText)
        this.defaultGenerateAppearance = saved

        // setRawValue cleared _markdownValue; store the markdown string now
        this._markdownValue = val

        this.updateAppearance()
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
        this.updateAppearance()
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

        this._embedFontInDR(font)

        // Update the DA string to use the font
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

        this.updateAppearance()
    }

    private _embedFontInDR(font: PdfFont): void {
        const resourceName = font.resourceName

        // Add font to field's default resources
        const dr =
            (this.content.get('DR') as PdfDictionary) || new PdfDictionary()
        let fontDict = dr.get('Font') as PdfDictionary
        if (!fontDict) {
            fontDict = new PdfDictionary()
            dr.set('Font', fontDict)
        }
        fontDict.set(resourceName, font.reference)
        this.content.set('DR', dr)

        // Also add to form's default resources if available
        if (this._form) {
            const formDr =
                this._form.defaultResources ||
                (new PdfDictionary() as PdfDefaultResourcesDictionary)
            let formFontDict = formDr.get('Font')
            if (!formFontDict) {
                formFontDict = new PdfDictionary()
                formDr.set('Font', formFontDict)
            }
            formFontDict.set(resourceName, font.reference)
            this._form.defaultResources = formDr
        }
    }

    get fontFamily(): FontFamily | null {
        return this._fontFamily ?? null
    }

    set fontFamily(family: FontFamily | null) {
        if (family === null) {
            this._fontFamily = undefined
            return
        }
        this._fontFamily = family
        // Setting regular via the existing setter keeps DA string in sync
        this.font = family.regular
        if (family.bold) this._embedFontInDR(family.bold)
        if (family.italic) this._embedFontInDR(family.italic)
        if (family.boldItalic) this._embedFontInDR(family.boldItalic)
    }

    get fontVariantNames(): {
        bold?: string
        italic?: string
        boldItalic?: string
    } {
        return {
            bold: this._fontFamily?.bold?.resourceName,
            italic: this._fontFamily?.italic?.resourceName,
            boldItalic: this._fontFamily?.boldItalic?.resourceName,
        }
    }

    protected get resolvedVariantFonts(): {
        bold?: PdfFont
        italic?: PdfFont
        boldItalic?: PdfFont
    } {
        return {
            bold: this._fontFamily?.bold,
            italic: this._fontFamily?.italic,
            boldItalic: this._fontFamily?.boldItalic,
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
        this.updateAppearance()
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

    get kids(): PdfArray<PdfObjectReference> | undefined {
        const kidsArray = this.content
            .get('Kids')
            ?.as(PdfArray<PdfObjectReference>)
        if (!kidsArray) return undefined
        return kidsArray
    }

    set kids(kids: PdfObjectReference[]) {
        if (kids.length === 0) {
            this.content.delete('Kids')
            return
        }
        const kidsArray = new PdfArray<PdfObjectReference>(kids)
        this.content.set('Kids', kidsArray)
    }

    private _resolveActionDict(key: 'AA' | 'A'): PdfDictionary | undefined {
        const entry = this.content.get(key)
        if (entry instanceof PdfObjectReference) {
            const resolved = entry.resolve()
            if (resolved?.content instanceof PdfDictionary) {
                return resolved.content
            }
        } else if (entry instanceof PdfDictionary) {
            return entry
        }
        return undefined
    }

    get actions(): PdfFieldActions | null {
        const aaDict = this._resolveActionDict('AA')
        if (!aaDict) return null

        return aaDict.becomes(PdfFieldActions, {
            activateDict: this._resolveActionDict('A'),
            engine: this._form?.jsEngine,
        })
    }

    get activateAction(): PdfJavaScriptAction | null {
        const aDict = this._resolveActionDict('A')
        if (!aDict) return null
        return aDict.becomes(PdfJavaScriptAction, {
            engine: this._form?.jsEngine,
        })
    }

    abstract generateAppearance(options?: {
        makeReadOnly?: boolean
        textYOffset?: number
        onStateName?: string
    }): boolean

    set appearanceStream(
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

    set downAppearanceStream(
        stream:
            | PdfIndirectObject
            | {
                  [key: string]: PdfIndirectObject
              },
    ) {
        this.appearanceStreamDict ||= new PdfDictionary()
        if (stream instanceof PdfIndirectObject) {
            this.appearanceStreamDict.set('D', stream.reference)
        } else {
            const dict = new PdfDictionary()
            for (const key in stream) {
                dict.set(key, stream[key].reference)
            }
            this.appearanceStreamDict.set('D', dict)
        }
    }

    get appearanceState(): string | null {
        return this.content.get('AS')?.as(PdfName)?.value ?? null
    }

    set appearanceState(state: string | null) {
        if (state === null) {
            this.content.delete('AS')
            return
        } else {
            this.content.set('AS', new PdfName(state))
        }

        if (
            this.defaultGenerateAppearance &&
            !this.hasAppearanceStream(state)
        ) {
            this.generateAppearance()
        }
    }

    /**
     * Returns the list of appearance state names from the normal appearance
     * dictionary (e.g. ["Yes", "Off"] for a checkbox).
     */
    get appearanceStates(): ReadonlyArray<string> {
        const n = this.appearanceStreamDict?.get('N')
        if (n instanceof PdfDictionary) {
            return n.keys().map((k) => k.value)
        }
        return []
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
            const key = setting ?? this.appearanceState ?? undefined
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

    hasAppearanceStream(setting: string): boolean {
        return this.appearanceStates.includes(setting)
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
