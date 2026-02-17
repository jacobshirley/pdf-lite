import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfBoolean } from '../core/objects/pdf-boolean.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfFontEncodingCache } from './PdfFontEncodingCache.js'
import { PdfAnnotationWriter } from '../annotations/PdfAnnotationWriter.js'
import { PdfXfaForm } from './xfa/PdfXfaForm.js'
import { PdfFormField } from './fields/PdfFormField.js'
// Import subclasses to trigger static registration blocks
import './fields/PdfTextFormField.js'
import './fields/PdfButtonFormField.js'
import './fields/PdfChoiceFormField.js'
import './fields/PdfSignatureFormField.js'
import type { FormContext } from './fields/types.js'

export type PdfDefaultResourcesDictionary = PdfDictionary<{
    Font?: PdfDictionary
    ProcSet?: PdfArray
    ExtGState?: PdfDictionary
    ColorSpace?: PdfDictionary
    Pattern?: PdfDictionary
    Shading?: PdfDictionary
    XObject?: PdfDictionary
}>

export class PdfAcroForm<
        T extends Record<string, string> = Record<string, string>,
    >
    extends PdfIndirectObject<
        PdfDictionary<{
            Fields: PdfArray<PdfObjectReference>
            NeedAppearances?: PdfBoolean
            SigFlags?: PdfNumber
            CO?: PdfArray<PdfObjectReference>
            DR?: PdfDefaultResourcesDictionary
            DA?: PdfString
            Q?: PdfNumber
            XFA?: PdfDictionary
        }>
    >
    implements FormContext<PdfFormField>
{
    fields: PdfFormField[]
    private _fontEncodingCache?: PdfFontEncodingCache
    private document?: PdfDocument

    constructor(options?: {
        other?: PdfIndirectObject
        fields?: PdfFormField[]
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

    private get fontEncodingCache(): PdfFontEncodingCache {
        if (!this._fontEncodingCache) {
            this._fontEncodingCache = new PdfFontEncodingCache(
                this.document,
                this.defaultResources,
            )
        }
        return this._fontEncodingCache
    }

    get fontEncodingMaps(): Map<string, Map<number, string>> {
        return this.fontEncodingCache.fontEncodingMaps
    }

    isModified(): boolean {
        return this.content.isModified()
    }

    get needAppearances(): boolean {
        return (
            this.content.get('NeedAppearances')?.as(PdfBoolean)?.value ?? false
        )
    }

    set needAppearances(value: boolean) {
        this.content.set('NeedAppearances', new PdfBoolean(value))
    }

    get signatureFlags(): number {
        return this.content.get('SigFlags')?.as(PdfNumber)?.value ?? 0
    }

    set signatureFlags(flags: number) {
        this.content.set('SigFlags', new PdfNumber(flags))
    }

    get defaultAppearance(): string | null {
        return this.content.get('DA')?.as(PdfString)?.value ?? null
    }

    set defaultAppearance(da: string) {
        this.content.set('DA', new PdfString(da))
    }

    get defaultQuadding(): number {
        return this.content.get('Q')?.as(PdfNumber)?.value ?? 0
    }

    set defaultQuadding(q: number) {
        this.content.set('Q', new PdfNumber(q))
    }

    get defaultResources(): PdfDefaultResourcesDictionary | null {
        return this.content.get('DR')?.as(PdfDictionary) ?? null
    }

    set defaultResources(resources: PdfDefaultResourcesDictionary | null) {
        if (resources === null) {
            this.content.delete('DR')
        } else {
            this.content.set('DR', resources)
        }
    }

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

    async getFontEncodingMap(
        fontName: string,
    ): Promise<Map<number, string> | null> {
        return this.fontEncodingCache.getFontEncodingMap(fontName)
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

        const fields: Map<string, PdfFormField> = new Map()

        const getFields = async (
            fieldRefs: PdfObjectReference[],
            parent?: PdfFormField,
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

                const field = PdfFormField.create({
                    other: fieldObject,
                    form: acroForm,
                    parent,
                })
                if (parent) {
                    field.parent = parent
                }

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

    private async cacheAllFontEncodings(): Promise<void> {
        await this.fontEncodingCache.cacheAllFontEncodings(this.fields)
    }

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
        await PdfAnnotationWriter.updatePageAnnotations(document, fieldsByPage)
    }

    async write(document: PdfDocument) {
        const catalog = document.root

        const isIncremental = document.isIncremental()
        document.setIncremental(true)

        const xfaForm = await PdfXfaForm.fromDocument(document)
        if (xfaForm) {
            const modifiedFields = this.fields
                .filter(
                    (f) =>
                        f.isModified() && f.fieldType !== 'Signature' && f.name,
                )
                .map((f) => ({ name: f.name, value: f.value }))
            if (modifiedFields.length > 0) {
                xfaForm.datasets?.updateFields(modifiedFields)
            }
        }

        const fieldsArray = new PdfArray<PdfObjectReference>()
        this.content.set('Fields', fieldsArray)

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
                const appearances = field.getAppearanceStreamsForWriting()
                if (appearances) {
                    document.add(appearances.primary)

                    if (appearances.secondary) {
                        document.add(appearances.secondary)
                    }

                    field.setAppearanceReference(
                        appearances.primary.reference,
                        appearances.secondary?.reference,
                    )

                    if (!field.print) {
                        field.print = true
                    }
                }

                document.add(field)

                fieldReference = new PdfObjectReference(
                    field.objectNumber,
                    field.generationNumber,
                )

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

        if (xfaForm) {
            xfaForm.write(document)
        }

        await document.commit()
        document.setIncremental(isIncremental)
    }
}
