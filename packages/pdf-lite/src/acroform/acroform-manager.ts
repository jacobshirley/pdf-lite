import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'

/**
 * Manages AcroForm fields in PDF documents.
 * Provides methods to read and write form field values.
 */
export class PdfAcroFormManager<
    T extends Record<string, string> = Record<string, string>,
> {
    private document: PdfDocument
    private _acroForm?: PdfDictionary

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
     * Sets a form field value by field name.
     * @param fieldName The name of the field to set
     * @param value The value to set
     * @throws Error if the field is not found
     */
    async setFieldValues(newFields: Partial<T>): Promise<void> {
        const acroForm = await this.getAcroForm()
        if (!acroForm) {
            throw new Error('Document does not contain AcroForm')
        }

        const fields = acroForm.get('Fields')?.as(PdfArray)
        if (!fields) {
            throw new Error('AcroForm has no fields')
        }

        const isIncremental = this.document.isIncremental()
        this.document.setIncremental(true)

        for (const [fieldName, value] of Object.entries(newFields)) {
            const fieldObject = await this.findFieldByName(fields, fieldName)
            if (!fieldObject) {
                throw new Error(`Field '${fieldName}' not found`)
            }

            const newObject = new PdfIndirectObject({
                ...fieldObject,
                content: fieldObject.content.clone(),
            })

            const fieldDict = newObject.content.as(PdfDictionary)
            fieldDict.set('V', new PdfString(value))

            await this.document.commit(newObject)
        }

        this.document.setIncremental(isIncremental)
    }

    /**
     * Gets the AcroForm dictionary from the document catalog.
     * @returns The AcroForm dictionary or null if not found
     */
    private async getAcroForm(): Promise<PdfDictionary | null> {
        if (this._acroForm) {
            return this._acroForm
        }

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

            this._acroForm = acroFormObject.content.as(PdfDictionary)
            return this._acroForm
        } else if (acroFormRef instanceof PdfDictionary) {
            this._acroForm = acroFormRef
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
}
