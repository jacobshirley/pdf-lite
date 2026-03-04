import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfPage } from './pdf-page.js'

type PdfPagesDictionary = PdfDictionary<{
    Type: PdfName<'Pages'>
    Kids: PdfArray<PdfObjectReference>
    Count: PdfNumber
    Parent?: PdfObjectReference
}>

export class PdfPages
    extends PdfIndirectObject<PdfPagesDictionary>
    implements Iterable<PdfPage>
{
    constructor(options?: PdfIndirectObject) {
        super(
            options ??
                new PdfIndirectObject({
                    content: new PdfDictionary({
                        Type: new PdfName('Pages'),
                        Kids: new PdfArray(),
                        Count: new PdfNumber(0),
                    }),
                }),
        )
    }

    get kids(): (PdfPage | PdfPages)[] {
        const kidsArray = this.content
            .get('Kids')
            ?.as(PdfArray<PdfObjectReference>)
        if (!kidsArray) return []

        return kidsArray.items.map((ref) => {
            const resolved = ref.as(PdfObjectReference)!.resolve()
            const type = resolved.content
                ?.as(PdfDictionary)
                ?.get('Type')
                ?.as(PdfName)

            if (type?.value === 'Pages') {
                return resolved.becomes(PdfPages)
            }
            return resolved.becomes(PdfPage)
        })
    }

    set kids(value: PdfArray<PdfObjectReference>) {
        this.content.set('Kids', value)
    }

    get count(): number {
        return this.content.get('Count')?.as(PdfNumber)?.value ?? 0
    }

    set count(value: number) {
        this.content.set('Count', new PdfNumber(value))
    }

    get parentRef(): PdfObjectReference | null {
        return this.content.get('Parent')?.as(PdfObjectReference) ?? null
    }

    set parentRef(value: PdfObjectReference | null) {
        if (value === null) {
            this.content.delete('Parent')
        } else {
            this.content.set('Parent', value)
        }
    }

    get parent(): PdfPages | null {
        const ref = this.parentRef
        if (!ref) return null
        return ref.resolve(PdfPages)
    }

    set parent(value: PdfPages | null) {
        this.parentRef = value?.reference ?? null
    }

    get(index: number): PdfPage {
        return [...this][index]
    }

    toArray(): PdfPage[] {
        return [...this]
    }

    *[Symbol.iterator](): Iterator<PdfPage> {
        const kidsArray = this.content
            .get('Kids')
            ?.as(PdfArray<PdfObjectReference>)
        if (!kidsArray) return

        for (const ref of kidsArray.items) {
            const resolved = ref.as(PdfObjectReference)?.resolve()
            if (!resolved) continue

            const typeEntry = resolved.content
                ?.as(PdfDictionary)
                ?.get('Type')
                ?.as(PdfName)

            if (typeEntry?.value === 'Pages') {
                yield* resolved.becomes(PdfPages)
            } else {
                yield resolved.becomes(PdfPage)
            }
        }
    }
}
