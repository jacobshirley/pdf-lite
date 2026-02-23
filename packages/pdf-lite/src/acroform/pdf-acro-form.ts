import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfBoolean } from '../core/objects/pdf-boolean.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfAnnotationWriter } from '../annotations/pdf-annotation-writer.js'
import { PdfFont } from '../fonts/pdf-font.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfXfaForm } from './xfa/pdf-xfa-form.js'
import { PdfFormField } from './fields/pdf-form-field.js'
// Import subclasses to trigger static registration blocks
import './fields/pdf-text-form-field.js'
import './fields/pdf-button-form-field.js'
import './fields/pdf-choice-form-field.js'
import './fields/pdf-signature-form-field.js'
import type { FormContext } from './fields/types.js'
import { PdfDefaultAppearance } from './fields/pdf-default-appearance.js'

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
    private fonts: Map<string, PdfFont> = new Map()
    private document?: PdfDocument
    private _xfa?: PdfXfaForm | null // undefined = not set; null = explicitly no XFA

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

    /**
     * Loads a font by resource name from default resources or page tree.
     * Caches the result for subsequent calls.
     */
    private async loadFont(fontName: string): Promise<PdfFont | null> {
        // Return cached font if available
        if (this.fonts.has(fontName)) {
            return this.fonts.get(fontName)!
        }

        if (!this.document) return null

        // Try to load from default resources first
        const dr = this.defaultResources
        if (dr) {
            const fontDictEntry = dr.get('Font')
            const fonts =
                fontDictEntry instanceof PdfDictionary ? fontDictEntry : null
            if (fonts) {
                const fontEntry = fonts.get(fontName)
                const fontRef =
                    fontEntry instanceof PdfObjectReference ? fontEntry : null
                if (fontRef) {
                    const font = await PdfFont.fromReference(
                        this.document,
                        fontRef,
                        fontName,
                    )
                    if (font) {
                        this.fonts.set(fontName, font)
                        return font
                    }
                }
            }
        }

        return null
    }

    /**
     * Resolves a font from a page's resource tree by walking up the parent chain.
     */
    private async resolveFontFromPage(
        fontName: string,
        pageRef: PdfObjectReference,
    ): Promise<PdfFont | null> {
        if (!this.document) return null

        // Walk up the parent chain (max 16 levels to avoid infinite loops)
        let currentRef: PdfObjectReference | null = pageRef
        for (let depth = 0; depth < 16 && currentRef; depth++) {
            const nodeObj = await this.document.readObject({
                objectNumber: currentRef.objectNumber,
                generationNumber: currentRef.generationNumber,
            })
            const nodeDict =
                nodeObj?.content instanceof PdfDictionary
                    ? nodeObj.content
                    : null
            if (!nodeDict) break

            // Try Resources.Font in this node
            const resourcesEntry = nodeDict.get('Resources')
            const resources =
                resourcesEntry instanceof PdfDictionary ? resourcesEntry : null
            if (resources) {
                const fontsEntry = resources.get('Font')
                const fonts =
                    fontsEntry instanceof PdfDictionary ? fontsEntry : null
                if (fonts) {
                    const fontEntry = fonts.get(fontName)
                    const fontRef =
                        fontEntry instanceof PdfObjectReference
                            ? fontEntry
                            : null
                    if (fontRef) {
                        // Found font reference
                        const font = await PdfFont.fromReference(
                            this.document,
                            fontRef,
                            fontName,
                        )
                        if (font) {
                            this.fonts.set(fontName, font)
                            return font
                        }
                        break
                    }
                }
            }

            // Walk to parent
            const parentEntry = nodeDict.get('Parent')
            currentRef =
                parentEntry instanceof PdfObjectReference ? parentEntry : null
        }

        return null
    }

    setXfa(xfa: PdfXfaForm | null): void {
        this._xfa = xfa
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

    getCachedFont(name: string): PdfFont | undefined {
        return this.fonts.get(name)
    }

    async getFontByName(name: string): Promise<PdfFont | undefined> {
        // Return cached font if available
        if (this.fonts.has(name)) {
            return this.fonts.get(name)
        }
        
        // Try to load the font if not cached
        const font = await this.loadFont(name)
        return font ?? undefined
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
            const acroFormObject = await document.readObject(acroFormRef)

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

                const fieldObject = await document.readObject(fieldRef)

                if (!fieldObject) continue
                if (!(fieldObject.content instanceof PdfDictionary)) continue

                const field = PdfFormField.create({
                    other: fieldObject,
                    form: acroForm,
                    parent,
                })

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
            const fieldsObj = await document.readObject(
                acroForm.content.get('Fields')!.as(PdfObjectReference),
            )

            if (fieldsObj && fieldsObj.content instanceof PdfArray) {
                fieldsArray.items.push(
                    ...fieldsObj.content.as(PdfArray<PdfObjectReference>).items,
                )
            }
        }

        await getFields(fieldsArray.items)

        // Pre-cache font encoding maps now that this.fields is populated
        await acroForm.cacheAllFontEncodings()

        // Reset field-level modified flag so only explicitly changed fields are detected
        for (const field of acroForm.fields) {
            field.setModified(false)
        }

        return acroForm
    }

    private async cacheAllFontEncodings(): Promise<void> {
        if (!this.document) return

        // Collect font names with an associated page ref for the first field
        // that uses them (needed to fall back to page resources).
        const fontPageRefs = new Map<string, PdfObjectReference | null>()

        for (const field of this.fields) {
            const daEntry = field.content.get('DA')
            const da = daEntry?.value ? PdfDefaultAppearance.parse(daEntry.value) : undefined // DA can be a string or missing
            if (da) {
                const fontName = da.fontName
                if (!fontPageRefs.has(fontName)) {
                    const pageEntry = field.content.get('P')
                    const pageRef =
                        pageEntry instanceof PdfObjectReference
                            ? pageEntry
                            : null
                    fontPageRefs.set(fontName, pageRef)
                }
            }
        }

        // Load each font and its encoding map
        for (const [fontName, pageRef] of fontPageRefs) {
            let font = await this.loadFont(fontName)
            // If the font was not in the AcroForm DR, try the field's page resources
            if (!font && pageRef) {
                font = await this.resolveFontFromPage(fontName, pageRef)
            }
        }
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

    async getXfa(document?: PdfDocument): Promise<PdfXfaForm | null> {
        if (this._xfa) {
            return this._xfa
        }

        const doc = document || this.document
        if (!doc) {
            throw new Error(
                'No document available to load XFA form. Provide a document or ensure this AcroForm is associated with a document.',
            )
        }
        this._xfa = await PdfXfaForm.fromDocument(doc)
        return this._xfa
    }

    async write(document?: PdfDocument) {
        document ||= this.document
        if (!document) {
            throw new Error('No document associated with this AcroForm')
        }

        const catalog = document.root

        const isIncremental = document.isIncremental()
        document.setIncremental(true)

        const xfaForm = await this.getXfa(document)
        if (xfaForm) {
            // Only send fields whose value was explicitly changed (field.isModified())
            const xfaFields = this.fields
                .filter(
                    (f) =>
                        f.isModified() && f.fieldType !== 'Signature' && f.name,
                )
                .map((f) => ({ name: f.name, value: f.value }))
            if (xfaFields.length > 0) {
                xfaForm.datasets?.updateFields(xfaFields)
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

        // Phase 1: add appearance streams standalone (PdfStream — cannot go in ObjStm)
        // and collect field dicts for ObjStm batching.
        const compressibleFields: PdfIndirectObject[] = []

        for (const field of this.fields) {
            if (field.content.isModified()) {
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

                compressibleFields.push(field)
            }
        }

        // Phase 2: pack field dicts into ObjStm — pre-assigns their object numbers.
        document.addObjectsAsStream(compressibleFields)

        // Phase 3: build fieldsArray now that field object numbers are stable.
        for (const field of this.fields) {
            let fieldReference: PdfObjectReference

            if (field.content.isModified()) {
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

        // Phase 4: pack AcroForm dict into ObjStm AFTER fieldsArray is populated,
        // so the dict is serialized with the correct Fields array.
        if (this.isModified()) {
            document.addObjectsAsStream([this])

            if (!catalog.content.has('AcroForm')) {
                let updatableCatalog = catalog
                if (catalog.isImmutable()) {
                    updatableCatalog = catalog.clone()
                    document.add(updatableCatalog)
                }
                updatableCatalog.content.set('AcroForm', this.reference)
            }
        }

        // XFA datasets stream — PdfXfaData extends PdfIndirectObject<PdfStream>, must stay standalone
        if (xfaForm?.datasets?.isModified()) {
            document.add(xfaForm.datasets)
        }

        await document.commit()
        document.setIncremental(isIncremental)
    }
}
