import { PdfDocument } from '../pdf/pdf-document.js'
import {
    PdfDictionary,
    PdfDictionaryEntries,
} from '../core/objects/pdf-dictionary.js'
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
    constructor() {
        super()
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
        const match = da.match(/\/F\d+\s+([\d.]+)\s+Tf/)
        if (match) {
            return parseFloat(match[1])
        }
        return null
    }

    set fontSize(size: number) {
        const da = this.get('DA')?.as(PdfString)?.value || ''
        const updatedDa = da.replace(/\/F\d+\s+[\d.]+?\s+Tf/g, `/F1 ${size} Tf`)
        this.set('DA', new PdfString(updatedDa))
    }

    get fontName(): string | null {
        const da = this.get('DA')?.as(PdfString)?.value || ''
        const match = da.match(/\/(F\d+)\s+[\d.]+\s+Tf/)
        if (match) {
            return match[1]
        }
        return null
    }

    set fontName(fontName: string) {
        const da = this.get('DA')?.as(PdfString)?.value || ''
        const updatedDa = da.replace(/\/F\d+/g, `/${fontName}`)
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

    constructor(options: { dict: PdfDictionary; fields?: PdfAcroFormField[] }) {
        super()
        this.copyFrom(options.dict)
        this.fields = options.fields ?? []
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
}

/**
 * Manages AcroForm fields in PDF documents.
 * Provides methods to read and write form field values.
 */
export class PdfAcroFormManager<
    T extends Record<string, string> = Record<string, string>,
> {
    private document: PdfDocument
    private _acroForm?: PdfAcroForm

    constructor(document: PdfDocument) {
        this.document = document
    }

    /**
     * Checks if the document contains AcroForm fields.
     * @returns True if the document has AcroForm fields, false otherwise
     */
    async hasAcroForm(): Promise<boolean> {
        try {
            const acroForm = await this.getAcroForm()
            return acroForm !== null
        } catch {
            return false
        }
    }

    /**
     * Gets all form field values as a key-value map.
     * @returns Object with field names as keys and values as strings
     */
    async getFieldValues(): Promise<T | null> {
        const acroForm = await this.getAcroForm()
        if (!acroForm) return null

        const fields = acroForm.get('Fields')?.as(PdfArray)
        if (!fields) return null

        const values: T = {} as T
        await this.collectFieldValues(fields, values)
        return values
    }

    /**
     * Gets all field names from the form
     * @returns Array of field names
     */
    async getFieldNames(): Promise<string[]> {
        const values = await this.getFieldValues()
        return values ? Object.keys(values) : []
    }

    /**
     * Gets a specific field by name
     * @param fieldName The name of the field to get
     * @returns The field object or null if not found
     */
    async getField(fieldName: string): Promise<PdfAcroFormField | null> {
        const acroForm = await this.getAcroForm()
        if (!acroForm) return null

        const fields = acroForm.get('Fields')?.as(PdfArray)
        if (!fields) return null

        const fieldObject = await this.findFieldByName(fields, fieldName)
        if (!fieldObject) return null

        const field = new PdfAcroFormField()
        field.copyFrom(fieldObject.content.as(PdfDictionary))
        return field
    }

    /**
     * Gets all fields from the form
     * @returns Array of field objects with their names
     */
    async getAllFields(): Promise<
        Array<{ name: string; field: PdfAcroFormField }>
    > {
        const acroForm = await this.getAcroForm()
        if (!acroForm) return []

        const fields = acroForm.get('Fields')?.as(PdfArray)
        if (!fields) return []

        const result: Array<{ name: string; field: PdfAcroFormField }> = []
        await this.collectAllFields(fields, result)
        return result
    }

    /**
     * Gets the value of a specific field
     * @param fieldName The name of the field
     * @returns The field value or null if not found
     */
    async getFieldValue(fieldName: string): Promise<string | null> {
        const values = await this.getFieldValues()
        if (!values) return null
        return values[fieldName] ?? null
    }

    /**
     * Sets a single field value
     * @param fieldName The name of the field to set
     * @param value The value to set
     * @throws Error if the field is not found
     */
    async setFieldValue(fieldName: string, value: string): Promise<void> {
        await this.setFieldValues({ [fieldName]: value } as Partial<T>)
    }

    /**
     * Sets multiple form field values by field name.
     * @param newFields Object with field names as keys and values to set
     * @throws Error if any field is not found
     */
    async setFieldValues(newFields: Partial<T>): Promise<void> {
        const acroFormObject = await this.getAcroFormObject()
        if (!acroFormObject) {
            throw new Error('Document does not contain AcroForm')
        }

        const acroForm = acroFormObject.content.as(PdfDictionary)
        const fields = acroForm.get('Fields')?.as(PdfArray)
        if (!fields) {
            throw new Error('AcroForm has no fields')
        }

        const isIncremental = this.document.isIncremental()
        this.document.setIncremental(true)

        // Update the AcroForm dictionary with NeedAppearances flag
        const updatedAcroForm = new PdfIndirectObject({
            ...acroFormObject,
            content: acroFormObject.content.clone(),
        })
        const updatedAcroFormDict = updatedAcroForm.content.as(PdfDictionary)

        // Let the PDF viewer know that appearances need to be regenerated
        updatedAcroFormDict.set('NeedAppearances', new PdfBoolean(true))
        await this.document.commit(updatedAcroForm)

        for (const [fieldName, value] of Object.entries(newFields)) {
            const fieldObject = await this.findFieldByName(fields, fieldName)
            if (!fieldObject) {
                throw new Error(`Field '${fieldName}' not found`)
            }

            const updatedField = new PdfIndirectObject({
                ...fieldObject,
                content: fieldObject.content.clone(),
            })

            const fieldDict = updatedField.content.as(PdfDictionary)

            // Set appearance state (AS) for button fields (checkboxes, radio buttons)
            // Button fields use PdfName for both V and AS, text fields use PdfString
            const fieldType = fieldDict.get('FT')?.as(PdfName)?.value
            if (fieldType === 'Btn') {
                fieldDict.set('V', new PdfName(value))
                fieldDict.set('AS', new PdfName(value))
            } else {
                fieldDict.set('V', new PdfString(value))
            }

            await this.document.commit(updatedField)
        }

        this.document.setIncremental(isIncremental)
    }

    /**
     * Gets the AcroForm indirect object from the document catalog.
     * @returns The AcroForm indirect object or null if not found
     */
    private async getAcroFormObject(): Promise<PdfIndirectObject<PdfDictionary> | null> {
        const catalog = this.document.rootDictionary
        if (!catalog) return null

        const acroFormRef = catalog.get('AcroForm')
        if (!acroFormRef) return null

        if (acroFormRef instanceof PdfObjectReference) {
            const acroFormObject = await this.document.readObject({
                objectNumber: acroFormRef.objectNumber,
                generationNumber: acroFormRef.generationNumber,
            })

            if (!acroFormObject) return null
            return acroFormObject as PdfIndirectObject<PdfDictionary>
        }

        return null
    }

    /**
     * Gets the AcroForm dictionary from the document catalog.
     * @returns The AcroForm dictionary or null if not found
     */
    private async getAcroForm(): Promise<PdfAcroForm | null> {
        if (this._acroForm) {
            return this._acroForm
        }

        const acroFormObject = await this.getAcroFormObject()
        if (acroFormObject) {
            this._acroForm = new PdfAcroForm({
                dict: acroFormObject.content.as(PdfDictionary),
            })
            return this._acroForm
        }

        const catalog = this.document.rootDictionary
        if (!catalog) return null

        const acroFormRef = catalog.get('AcroForm')
        if (acroFormRef instanceof PdfDictionary) {
            this._acroForm = new PdfAcroForm({ dict: acroFormRef })
            return this._acroForm
        }

        return null
    }

    /**
     * Recursively collects field values from the field tree.
     */
    private async collectFieldValues(
        fields: PdfArray,
        values: Record<string, string>,
        parentName: string = '',
    ): Promise<void> {
        for (const fieldRef of fields.items) {
            if (!(fieldRef instanceof PdfObjectReference)) continue

            // Check if we have a modified version cached
            const fieldObject = await this.document.readObject({
                objectNumber: fieldRef.objectNumber,
                generationNumber: fieldRef.generationNumber,
            })

            if (!fieldObject) continue

            const fieldDict = fieldObject.content.as(PdfDictionary)
            const fieldName = this.getFieldName(fieldDict, parentName)

            // Get field value (return empty string if no value set)
            const value = fieldDict.get('V')
            if (value instanceof PdfString) {
                values[fieldName] = value.value
            } else if (value instanceof PdfName) {
                values[fieldName] = value.value
            } else if (fieldName) {
                // Include empty fields
                values[fieldName] = ''
            }

            // Process child fields (Kids)
            const kids = fieldDict.get('Kids')?.as(PdfArray)
            if (kids) {
                await this.collectFieldValues(kids, values, fieldName)
            }
        }
    }

    /**
     * Finds a field by its fully qualified name.
     */
    private async findFieldByName(
        fields: PdfArray,
        targetName: string,
        parentName: string = '',
    ): Promise<PdfIndirectObject | null> {
        for (const fieldRef of fields.items) {
            if (!(fieldRef instanceof PdfObjectReference)) continue

            // Check if we have a modified version cached
            const fieldObject = await this.document.readObject({
                objectNumber: fieldRef.objectNumber,
                generationNumber: fieldRef.generationNumber,
            })

            if (!fieldObject) continue

            const fieldDict = fieldObject.content.as(PdfDictionary)
            const fieldName = this.getFieldName(fieldDict, parentName)

            if (fieldName === targetName) {
                return fieldObject
            }

            // Search in child fields (Kids)
            const kids = fieldDict.get('Kids')?.as(PdfArray)
            if (kids) {
                const found = await this.findFieldByName(
                    kids,
                    targetName,
                    fieldName,
                )
                if (found) return found
            }
        }

        return null
    }

    /**
     * Gets the fully qualified field name.
     */
    private getFieldName(fieldDict: PdfDictionary, parentName: string): string {
        const partialName = fieldDict.get('T')?.as(PdfString)?.value ?? ''
        if (!parentName) return partialName
        return `${parentName}.${partialName}`
    }

    /**
     * Recursively collects all fields from the field tree.
     */
    private async collectAllFields(
        fields: PdfArray,
        result: Array<{ name: string; field: PdfAcroFormField }>,
        parentName: string = '',
    ): Promise<void> {
        for (const fieldRef of fields.items) {
            if (!(fieldRef instanceof PdfObjectReference)) continue

            const fieldObject = await this.document.readObject({
                objectNumber: fieldRef.objectNumber,
                generationNumber: fieldRef.generationNumber,
            })

            if (!fieldObject) continue

            const fieldDict = fieldObject.content.as(PdfDictionary)
            const fieldName = this.getFieldName(fieldDict, parentName)

            const field = new PdfAcroFormField()
            field.copyFrom(fieldDict)
            result.push({ name: fieldName, field })

            // Process child fields (Kids)
            const kids = fieldDict.get('Kids')?.as(PdfArray)
            if (kids) {
                await this.collectAllFields(kids, result, fieldName)
            }
        }
    }

    /**
     * Flattens the form by removing all fields and making them part of the page content.
     * This makes the form non-editable.
     * @returns Promise that resolves when flattening is complete
     */
    async flatten(): Promise<void> {
        // TODO: Implement form flattening
        // This would involve:
        // 1. Rendering field appearances to page content streams
        // 2. Removing field annotations from pages
        // 3. Removing AcroForm from catalog
        throw new Error('Form flattening is not yet implemented')
    }

    /**
     * Resets all fields to their default values.
     * @returns Promise that resolves when reset is complete
     */
    async resetFields(): Promise<void> {
        const allFields = await this.getAllFields()
        const resetValues: Partial<T> = {} as Partial<T>

        for (const { name, field } of allFields) {
            const defaultValue = field.defaultValue
            if (defaultValue) {
                resetValues[name as keyof T] = defaultValue as T[keyof T]
            }
        }

        await this.setFieldValues(resetValues)
    }

    /**
     * Exports form data as JSON
     * @returns JSON string of form data
     */
    async exportData(): Promise<string> {
        const values = await this.getFieldValues()
        return JSON.stringify(values, null, 2)
    }

    /**
     * Imports form data from JSON
     * @param json JSON string containing field values
     */
    async importData(json: string): Promise<void> {
        const data = JSON.parse(json) as Partial<T>
        await this.setFieldValues(data)
    }
}
