import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfPage } from './pdf-page.js'
import type { PdfDocument } from './pdf-document.js'

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

    /**
     * Add a new page to this pages tree.
     * @param options Page configuration options
     * @returns The newly created PdfPage
     */
    add(options?: { width?: number; height?: number }): PdfPage {
        const width = options?.width ?? 612
        const height = options?.height ?? 792

        // Create an empty content stream for the page
        const contentStreamObj = new PdfIndirectObject({
            content: new PdfStream({
                header: new PdfDictionary(),
                original: '',
            }),
        })

        // Create the page dictionary
        const pageDict = new PdfDictionary({
            Type: new PdfName('Page'),
            Parent: this.reference,
            MediaBox: new PdfArray(
                [0, 0, width, height].map((v) => new PdfNumber(v)),
            ),
            Contents: contentStreamObj.reference,
            Resources: new PdfDictionary(),
        })
        const pageObj = new PdfIndirectObject({ content: pageDict })

        // Add page reference to Kids array
        const kids = this.content.get('Kids')?.as(PdfArray)
        if (!kids) throw new Error('Pages tree has no Kids array')
        kids.items.push(pageObj.reference)

        // Increment page count
        this.count = this.count + 1
        this.setModified(true)

        // Return the page as a PdfPage instance
        return pageObj.becomes(PdfPage)
    }

    remove(page: PdfPage): void {
        const kids = this.content.get('Kids')?.as(PdfArray)
        if (!kids) throw new Error('Pages tree has no Kids array')

        // Find the index of the page to remove
        const pageIndex = kids.items.findIndex(
            (ref) => ref.as(PdfObjectReference)?.resolve() === page,
        )
        if (pageIndex === -1) {
            throw new Error('Page not found in this Pages tree')
        }

        // Remove the page reference from the Kids array
        kids.items.splice(pageIndex, 1)

        // Decrement page count
        this.count = this.count - 1
        this.setModified(true)
    }
}
