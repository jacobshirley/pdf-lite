import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfBoolean } from '../core/objects/pdf-boolean.js'
import { PdfNumber } from '../core/objects/pdf-number.js'

/**
 * Field types for AcroForm fields
 */
export const PdfFieldType = {
    Text: 'Tx',
    Button: 'Btn',
    Choice: 'Ch',
    Signature: 'Sig',
} as const

export class PdfAcroFormField extends PdfDictionary<{
    FT: PdfName<'Tx' | 'Btn' | 'Ch' | 'Sig'>
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
}> {
    parent?: PdfAcroFormField
    readonly container?: PdfIndirectObject

    constructor(options?: { container?: PdfIndirectObject }) {
        super()
        this.container = options?.container
    }

    /**
     * Gets the field type
     */
    get fieldType(): string | null {
        return this.get('FT')?.as(PdfName)?.value ?? null
    }

    /**
     * Gets the field name
     */
    get name(): string {
        return this.get('T')?.as(PdfString)?.value ?? ''
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
        if (fieldType === PdfFieldType.Button) {
            this.set('DV', new PdfName(val))
        } else {
            this.set('DV', new PdfString(val))
        }
    }

    get value(): string {
        const v = this.get('V')
        if (v instanceof PdfString) {
            return v.value
        } else if (v instanceof PdfName) {
            return v.value
        }
        return ''
    }

    set value(val: string) {
        const fieldType = this.get('FT')?.as(PdfName)?.value
        if (fieldType === 'Btn') {
            this.set('V', new PdfName(val))
            this.set('AS', new PdfName(val))
        } else {
            this.set('V', new PdfString(val))
        }
    }

    get checked(): boolean {
        const fieldType = this.get('FT')?.as(PdfName)?.value
        if (fieldType === 'Btn') {
            const v = this.get('V')
            return v instanceof PdfName && v.value === 'Yes'
        }
        return false
    }

    set checked(isChecked: boolean) {
        const fieldType = this.get('FT')?.as(PdfName)?.value
        if (fieldType === 'Btn') {
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

    constructor(options: {
        dict: PdfDictionary
        fields?: PdfAcroFormField[]
        container?: PdfIndirectObject
    }) {
        super()
        this.copyFrom(options.dict)
        this.fields = options.fields ?? []
        this.container = options.container
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

    static async fromDocument(
        document: PdfDocument,
    ): Promise<PdfAcroForm | null> {
        const catalog = document.rootDictionary
        if (!catalog) return null

        const acroFormRef = catalog.get('AcroForm')
        if (!(acroFormRef instanceof PdfObjectReference)) return null

        const acroFormObject = await document.readObject({
            objectNumber: acroFormRef.objectNumber,
            generationNumber: acroFormRef.generationNumber,
        })

        if (!acroFormObject) return null
        if (!(acroFormObject.content instanceof PdfDictionary))
            throw new Error('AcroForm content must be a dictionary')

        const acroForm = new PdfAcroForm({
            dict: acroFormObject.content,
            container: acroFormObject,
        })

        const getFields = async (
            fields: PdfArray<PdfObjectReference>,
            output: PdfAcroFormField[] = [],
            parent?: PdfAcroFormField,
        ): Promise<PdfAcroFormField[]> => {
            for (const fieldRef of fields.items) {
                // Check if we have a modified version cached
                const fieldObject = await document.readObject({
                    objectNumber: fieldRef.objectNumber,
                    generationNumber: fieldRef.generationNumber,
                })

                if (!fieldObject) continue
                if (!(fieldObject.content instanceof PdfDictionary)) continue

                const field = new PdfAcroFormField({
                    container: fieldObject,
                })
                field.parent = parent
                field.copyFrom(fieldObject.content)

                // Process child fields (Kids)
                const kids = field.get('Kids')?.as(PdfArray<PdfObjectReference>)
                if (kids) {
                    await getFields(kids, output, field)
                }

                acroForm.fields.push(field)
            }

            return output
        }

        await getFields(
            acroForm.get('Fields')?.as(PdfArray<PdfObjectReference>) ||
                new PdfArray(),
        )

        return acroForm
    }

    async write(document: PdfDocument) {
        const catalog = document.rootDictionary
        if (!catalog) {
            throw new Error('Document has no root catalog')
        }

        const isIncremental = document.isIncremental()
        document.setIncremental(true)

        if (this.isModified()) {
            // Create or update the AcroForm entry in the catalog
            const acroFormIndirect = new PdfIndirectObject({
                ...this.container,
                content: this,
            })
            document.add(acroFormIndirect)
            catalog.set('AcroForm', acroFormIndirect.reference)
        }

        for (const field of this.fields) {
            if (!field.isModified()) continue
            const acroFormFieldIndirect = new PdfIndirectObject({
                ...field.container,
                content: field,
            })
            document.add(acroFormFieldIndirect)
        }

        await document.commit()
        document.setIncremental(isIncremental)
    }
}
