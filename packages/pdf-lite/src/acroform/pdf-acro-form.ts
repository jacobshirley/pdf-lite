import { PdfDocument } from '../pdf/pdf-document.js'
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

export class PdfAcroFormObject<
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
        XFA?: PdfDictionary
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
            result.push(PdfFormField.create(resolved))
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
}
