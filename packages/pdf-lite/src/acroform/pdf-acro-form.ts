import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfBoolean } from '../core/objects/pdf-boolean.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfFormField } from './fields/pdf-form-field.js'
// Import subclasses to trigger static registration blocks
import './fields/pdf-text-form-field.js'
import './fields/pdf-button-form-field.js'
import './fields/pdf-choice-form-field.js'
import './fields/pdf-signature-form-field.js'
import { PdfDefaultResourcesDictionary } from '../annotations/pdf-default-resources.js'
import { buildEncodingMap } from '../utils/decodeWithFontEncoding.js'
import { PdfXfaForm } from './xfa/pdf-xfa-form.js'

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
        XFA?: PdfArray<PdfObjectReference>
    }>
> {
    constructor(options?: PdfIndirectObject) {
        super(
            options ??
                new PdfIndirectObject({
                    content: new PdfDictionary(),
                }),
        )
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

    get fields(): PdfFormField[] {
        const refs = this.content.get('Fields')?.items ?? []
        const result: PdfFormField[] = []
        for (const ref of refs) {
            const resolved = ref.resolve()
            if (!(resolved?.content instanceof PdfDictionary)) continue
            const field = PdfFormField.create(resolved)
            field.form = this
            result.push(field)
        }
        const content = this.content
        const originalPush = result.push.bind(result)
        result.push = (...items: PdfFormField[]): number => {
            const len = originalPush(...items)
            let fieldsArray = content.get('Fields')
            if (!fieldsArray) {
                fieldsArray = new PdfArray()
                content.set('Fields', fieldsArray)
            }
            for (const item of items) {
                fieldsArray.items.push(item.reference)

                // Auto-add to the page's Annots array
                const pageRef = item.parentRef
                if (pageRef) {
                    try {
                        const pageObj = pageRef.resolve()
                        if (pageObj?.content instanceof PdfDictionary) {
                            let annots = pageObj.content.get('Annots')
                            if (!annots) {
                                annots = new PdfArray()
                                pageObj.content.set('Annots', annots)
                            }
                            if (annots instanceof PdfArray) {
                                annots.items.push(item.reference)
                            }
                        }
                    } catch {
                        // page ref not resolvable
                    }
                }
            }
            return len
        }
        return result
    }

    set fields(newFields: PdfFormField[]) {
        this.content.set('Fields', PdfArray.refs(newFields))
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

    fontEncodingMaps: Map<string, Map<number, string>> = new Map()

    getFontEncodingMap(fontName: string): Map<number, string> | null {
        if (this.fontEncodingMaps.has(fontName)) {
            return this.fontEncodingMaps.get(fontName)!
        }

        const dr = this.defaultResources
        const fontDict = dr?.get('Font')?.as(PdfDictionary)
        if (!fontDict) return null

        const fontEntry = fontDict.get(fontName)
        if (!fontEntry) return null

        let fontObj: PdfDictionary | undefined
        if (fontEntry instanceof PdfObjectReference) {
            try {
                const resolved = fontEntry.resolve()
                if (resolved?.content instanceof PdfDictionary) {
                    fontObj = resolved.content
                }
            } catch {
                // resolver not available
            }
        } else if (fontEntry instanceof PdfDictionary) {
            fontObj = fontEntry
        }

        if (!fontObj) return null

        let encObj = fontObj.get('Encoding')
        if (encObj instanceof PdfObjectReference) {
            try {
                encObj = encObj.resolve()?.content
            } catch {
                // resolver not available
            }
        }

        const encDict = encObj instanceof PdfDictionary ? encObj : undefined
        const diffs = encDict?.get('Differences')?.as(PdfArray)
        if (!diffs) return null

        const map = buildEncodingMap(diffs)
        if (map) {
            this.fontEncodingMaps.set(fontName, map)
        }
        return map
    }

    get xfa(): PdfXfaForm | null {
        const xfaEntry = this.content.get('XFA')
        if (!xfaEntry) return null

        if (!(xfaEntry instanceof PdfArray)) {
            return null
        }

        return new PdfXfaForm(xfaEntry)
    }
}
