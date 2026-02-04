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

/**
 * Field types for AcroForm fields
 */
export const PdfFieldType = {
    Text: 'Tx',
    Button: 'Btn',
    Choice: 'Ch',
    Signature: 'Sig',
} as const

export type PdfFieldType = (typeof PdfFieldType)[keyof typeof PdfFieldType]

export class PdfAcroFormField extends PdfDictionary<{
    FT: PdfName<PdfFieldType>
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
    get fieldType(): PdfFieldType | null {
        return this.get('FT')?.as(PdfName)?.value ?? null
    }

    set fieldType(type: PdfFieldType | null) {
        if (type === null) {
            this.delete('FT')
        } else {
            this.set('FT', new PdfName(type))
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
        if (fieldType === PdfFieldType.Button) {
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
    }

    get checked(): boolean {
        const fieldType = this.get('FT')?.as(PdfName)?.value
        if (fieldType === PdfFieldType.Button) {
            const v = this.get('V')
            return v instanceof PdfName && v.value === 'Yes'
        }
        return false
    }

    set checked(isChecked: boolean) {
        const fieldType = this.get('FT')?.as(PdfName)?.value
        if (fieldType === PdfFieldType.Button) {
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

        return acroForm
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

            const pageDict = pageObj.content.as(PdfDictionary)
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
            if (!field.isModified()) continue
            const acroFormFieldIndirect = new PdfIndirectObject({
                ...field.container,
                content: field,
            })
            let fieldReference: PdfObjectReference | undefined

            if (field.isModified()) {
                // Write modified field as an indirect object
                const acroFormFieldIndirect = new PdfIndirectObject({
                    ...field.container,
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
                const container: any = field.container as any
                if (
                    container &&
                    typeof container.objectNumber === 'number' &&
                    typeof container.generationNumber === 'number'
                ) {
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
                ...this.container,
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
