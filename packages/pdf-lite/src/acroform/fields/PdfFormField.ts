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
import { PdfWidgetAnnotation } from '../../annotations/PdfWidgetAnnotation.js'
import { PdfDefaultAppearance } from './PdfDefaultAppearance.js'
import { TextAppearanceGenerator } from '../appearance/TextAppearanceGenerator.js'
import { ButtonAppearanceGenerator } from '../appearance/ButtonAppearanceGenerator.js'
import { ChoiceAppearanceGenerator } from '../appearance/ChoiceAppearanceGenerator.js'
import type { FormContext, PdfFieldType } from './types.js'
import { PdfFieldType as PdfFieldTypeConst } from './types.js'

/**
 * Base form field class. Extends PdfWidgetAnnotation with form-specific properties:
 * FT, V, DA, Ff, T (name), field hierarchy (parent/children/siblings), appearance dispatch.
 */
export class PdfFormField extends PdfWidgetAnnotation {
    private _parent?: PdfFormField
    defaultGenerateAppearance: boolean = true
    protected _appearanceStream?: PdfStream
    protected _appearanceStreamYes?: PdfStream
    form?: FormContext<PdfFormField>

    constructor(options?: {
        other?: PdfIndirectObject
        form?: FormContext<PdfFormField>
        parent?: PdfFormField
    }) {
        super({ other: options?.other })
        this.form = options?.form
        if (options?.parent) {
            this._parent = options.parent
        }
    }

    get parent(): PdfFormField | undefined {
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

    set parent(field: PdfFormField | undefined) {
        if (this._parent) {
            this._parent.kids = this._parent.kids.filter(
                (k) =>
                    k.objectNumber !== this.objectNumber ||
                    k.generationNumber !== this.generationNumber,
            )
        }
        this._parent = field
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

    get children(): PdfFormField[] {
        if (!this.form) return []
        return this.form.fields.filter((f) => f.parent === this)
    }

    set children(fields: PdfFormField[]) {
        for (const child of this.children) {
            child._parent = undefined
        }
        this.kids = fields.map((f) => f.reference)
        for (const child of fields) {
            child._parent = this
        }
    }

    get siblings(): PdfFormField[] {
        return this.parent?.children ?? []
    }

    get encodingMap(): Map<number, string> | undefined {
        const fontName = this.fontName
        if (!fontName) return undefined
        return this.form?.fontEncodingMaps?.get(fontName)
    }

    isModified(): boolean {
        return this.content.isModified()
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
        if (this.fieldType === 'Button') {
            this.content.set('DV', new PdfName(val))
        } else {
            this.content.set('DV', new PdfString(val))
        }
    }

    get value(): string {
        const v = this.content.get('V') ?? this.parent?.content.get('V')
        if (v instanceof PdfString) {
            if (v.isUTF16BE) return v.value
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
        if (this.value === val) return

        const fieldParent = this.parent?.content.get('FT')
            ? this.parent
            : undefined
        const fieldType = this.fieldType
        if (fieldType === 'Button') {
            val = val instanceof PdfString ? val.value : val
            if (val.trim() === '') {
                this.content.delete('V')
                fieldParent?.content.delete('V')
                this.content.delete('AS')
                return
            }
            this.content.set('V', new PdfName(val))
            fieldParent?.content.set('V', new PdfName(val))
            this.content.set('AS', new PdfName(val))
        } else {
            const pdfVal = val instanceof PdfString ? val : new PdfString(val)
            this.content.set('V', pdfVal)
            fieldParent?.content.set('V', pdfVal)
        }

        if (this.defaultGenerateAppearance) {
            this.generateAppearance()
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
        const parsed = PdfDefaultAppearance.parse(da)
        return parsed?.fontSize ?? null
    }

    set fontSize(size: number) {
        const da = this.defaultAppearance || ''
        if (!da) {
            this.content.set('DA', new PdfString(`/F1 ${size} Tf 0 g`))
            return
        }
        const parsed = PdfDefaultAppearance.parse(da)
        if (parsed) {
            this.content.set(
                'DA',
                new PdfString(parsed.withFontSize(size).toString()),
            )
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
            this.content.set('DA', new PdfString(`/${fontName} 12 Tf 0 g`))
            return
        }
        const parsed = PdfDefaultAppearance.parse(da)
        if (parsed) {
            this.content.set(
                'DA',
                new PdfString(parsed.withFontName(fontName).toString()),
            )
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
                new PdfString(`/${resourceName} ${currentSize} Tf 0 g`),
            )
            return
        }
        const parsed = PdfDefaultAppearance.parse(da)
        if (parsed) {
            this.content.set(
                'DA',
                new PdfString(parsed.withFontName(resourceName).toString()),
            )
        }
    }

    // Field flags (Ff) - with parent inheritance
    get flags(): number {
        const own = this.content.get('Ff')?.as(PdfNumber)?.value
        if (own !== undefined) return own
        return this.parent?.flags ?? 0
    }
    set flags(flags: number) {
        this.content.set('Ff', new PdfNumber(flags))
    }

    private getFlag(bit: number): boolean {
        return (this.flags & bit) !== 0
    }

    private setFlag(bit: number, value: boolean): void {
        if (value) {
            this.flags = this.flags | bit
        } else {
            this.flags = this.flags & ~bit
        }
    }

    get readOnly(): boolean {
        return this.getFlag(1)
    }
    set readOnly(v: boolean) {
        this.setFlag(1, v)
    }

    get required(): boolean {
        return this.getFlag(2)
    }
    set required(v: boolean) {
        this.setFlag(2, v)
    }

    get multiline(): boolean {
        return this.getFlag(4096)
    }
    set multiline(v: boolean) {
        this.setFlag(4096, v)
    }

    get password(): boolean {
        return this.getFlag(8192)
    }
    set password(v: boolean) {
        this.setFlag(8192, v)
    }

    get comb(): boolean {
        return this.getFlag(16777216)
    }

    get combField(): boolean {
        return this.getFlag(16777216)
    }
    set combField(v: boolean) {
        this.setFlag(16777216, v)
    }

    get combo(): boolean {
        return this.getFlag(131072)
    }
    set combo(v: boolean) {
        this.setFlag(131072, v)
    }

    get radio(): boolean {
        return this.getFlag(32768)
    }
    set radio(v: boolean) {
        this.setFlag(32768, v)
    }

    get noToggleToOff(): boolean {
        return this.getFlag(16384)
    }
    set noToggleToOff(v: boolean) {
        this.setFlag(16384, v)
    }

    get noExport(): boolean {
        return this.getFlag(4)
    }
    set noExport(v: boolean) {
        this.setFlag(4, v)
    }

    get pushButton(): boolean {
        return this.getFlag(65536)
    }
    set pushButton(v: boolean) {
        this.setFlag(65536, v)
    }

    get edit(): boolean {
        return this.getFlag(262144)
    }
    set edit(v: boolean) {
        this.setFlag(262144, v)
    }

    get sort(): boolean {
        return this.getFlag(524288)
    }
    set sort(v: boolean) {
        this.setFlag(524288, v)
    }

    get multiSelect(): boolean {
        return this.getFlag(2097152)
    }
    set multiSelect(v: boolean) {
        this.setFlag(2097152, v)
    }

    get doNotSpellCheck(): boolean {
        return this.getFlag(4194304)
    }
    set doNotSpellCheck(v: boolean) {
        this.setFlag(4194304, v)
    }

    get doNotScroll(): boolean {
        return this.getFlag(8388608)
    }
    set doNotScroll(v: boolean) {
        this.setFlag(8388608, v)
    }

    get commitOnSelChange(): boolean {
        return this.getFlag(67108864)
    }
    set commitOnSelChange(v: boolean) {
        this.setFlag(67108864, v)
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

    get options(): string[] {
        const opt =
            this.content.get('Opt')?.as(PdfArray<PdfString>) ??
            this.parent?.content.get('Opt')?.as(PdfArray<PdfString>)
        if (!opt) return []
        return opt.items.map((item) => item.value)
    }

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

    generateAppearance(options?: {
        makeReadOnly?: boolean
        textYOffset?: number
    }): boolean {
        const fieldType = this.fieldType
        if (fieldType === 'Text') {
            return this.generateTextAppearance(options)
        } else if (fieldType === 'Button') {
            return this.generateButtonAppearance(options)
        } else if (fieldType === 'Choice') {
            return this.generateChoiceAppearance(options)
        }
        return false
    }

    private generateTextAppearance(options?: {
        makeReadOnly?: boolean
        textYOffset?: number
    }): boolean {
        const fieldDR = (this.content as PdfDictionary)
            .get('DR')
            ?.as(PdfDictionary)
        const stream = TextAppearanceGenerator.generate({
            rect: this.rect,
            value: this.value,
            defaultAppearance: this.defaultAppearance,
            multiline: this.multiline,
            comb: this.comb,
            maxLen: this.maxLen,
            fieldDR,
            acroformDR: this.form?.defaultResources,
        })
        if (!stream) return false
        this._appearanceStream = stream
        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        } else {
            this.print = true
        }
        return true
    }

    private generateButtonAppearance(options?: {
        makeReadOnly?: boolean
    }): boolean {
        const result = ButtonAppearanceGenerator.generate({
            rect: this.rect,
            flags: this.flags,
        })
        if (!result) return false
        this._appearanceStream = result.primary
        this._appearanceStreamYes = result.secondary
        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }

    private generateChoiceAppearance(options?: {
        makeReadOnly?: boolean
    }): boolean {
        const fieldDR = (this.content as PdfDictionary)
            .get('DR')
            ?.as(PdfDictionary)
        const stream = ChoiceAppearanceGenerator.generate({
            rect: this.rect,
            value: this.value,
            defaultAppearance: this.defaultAppearance,
            flags: this.flags,
            fieldDR,
            acroformDR: this.form?.defaultResources,
        })
        if (!stream) return false
        this._appearanceStream = stream
        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }

    getAppearanceStream(): PdfStream | undefined {
        if (this.fieldType === 'Button') {
            if (this.checked && this._appearanceStreamYes) {
                return this._appearanceStreamYes
            }
            return this._appearanceStream
        }
        return this._appearanceStream
    }

    getAppearanceStreamsForWriting():
        | { primary: PdfStream; secondary?: PdfStream }
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

    setAppearanceReference(
        appearanceStreamRef: PdfObjectReference,
        appearanceStreamYesRef?: PdfObjectReference,
    ): void {
        let apDict = this.appearanceStreamDict
        if (!apDict) {
            apDict = new PdfDictionary()
            this.appearanceStreamDict = apDict
        }
        if (appearanceStreamYesRef && this.fieldType === 'Button') {
            const stateDict = new PdfDictionary()
            stateDict.set('Off', appearanceStreamRef)
            stateDict.set('Yes', appearanceStreamYesRef)
            apDict.set('N', stateDict)
        } else {
            apDict.set('N', appearanceStreamRef)
        }
    }
}

/** Backward compatible alias */
export { PdfFormField as PdfAcroFormField }
