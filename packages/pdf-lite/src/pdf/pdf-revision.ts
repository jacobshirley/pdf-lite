import { PdfDictionary } from '../core/objects/pdf-dictionary'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfObject } from '../core/objects/pdf-object'
import { PdfStream, PdfXRefStream } from '../core/objects/pdf-stream'
import { PdfTrailerEntries } from '../core/objects/pdf-trailer'
import { PdfXRefTable } from '../core/objects/pdf-xref-table'
import { PdfToken } from '../core/tokens/token'
import { PdfWhitespaceToken } from '../core/tokens/whitespace-token'
import { PdfXrefLookup } from './pdf-xref-lookup'

export class PdfRevision extends PdfObject {
    objects: PdfObject[] = []
    xref: PdfXrefLookup
    locked: boolean = false

    constructor(options?: {
        objects?: PdfObject[]
        prev?: PdfXrefLookup | PdfRevision
        locked?: boolean
    }) {
        super()
        this.objects = options?.objects ?? []

        this.xref = PdfXrefLookup.fromObjects(this.objects)

        if (options?.prev) this.setPrev(options.prev)
        if (!this.contains(this.xref.object))
            this.addObject(...this.xref.toTrailerSection())
        this.locked = options?.locked ?? false
    }

    setPrev(xref: PdfXrefLookup | PdfRevision) {
        xref = xref instanceof PdfRevision ? xref.xref : xref
        this.xref.setPrev(xref)
    }

    contains(object: PdfObject): boolean {
        return this.objects.includes(object)
    }

    exists(object: PdfObject): boolean {
        for (const obj of this.objects) {
            if (obj.equals(object)) {
                return true
            }
        }
        return false
    }

    unshift(...objects: PdfObject[]): void {
        for (const obj of objects.reverse()) {
            this.objects.unshift(obj)
            if (obj instanceof PdfIndirectObject) this.xref.addObject(obj)
        }
    }

    addObject(...objects: PdfObject[]): void {
        for (const obj of objects) {
            this.addObjectAt(obj)
        }
    }

    addObjectAt(object: PdfObject, index?: number | PdfObject): void {
        if (this.locked) {
            throw new Error('Cannot add object to locked PDF revision')
        }

        if (index === undefined) {
            index =
                object instanceof PdfIndirectObject
                    ? this.xref.object
                    : this.objects.length
        }

        if (typeof index !== 'number') {
            index = this.objects.indexOf(index)

            if (index === -1) {
                index = this.objects.length
            }
        }

        if (index < 0 || index > this.objects.length) {
            throw new Error('Index out of bounds')
        }

        this.objects.splice(index, 0, object)
        this.sortObjects()

        if (object instanceof PdfIndirectObject) {
            this.xref.addObject(object)
        }
    }

    deleteObject(...objects: PdfObject[]): void {
        if (this.locked) {
            throw new Error('Cannot delete object from locked PDF revision')
        }

        for (const object of objects) {
            const index = this.objects.indexOf(object)
            if (index === -1) {
                return
            }

            this.objects.splice(index, 1)

            if (object instanceof PdfIndirectObject) {
                this.xref.removeObject(object)
            }
        }
    }

    update(): void {
        this.sortObjects()
        this.xref.update()
    }

    sortObjects(): void {
        this.objects.sort((a, b) => {
            if (
                a instanceof PdfIndirectObject &&
                b instanceof PdfIndirectObject
            ) {
                return a.insertOrder() - b.insertOrder()
            } else if (a instanceof PdfIndirectObject) {
                return -1
            } else if (b instanceof PdfIndirectObject) {
                return 1
            } else {
                return 0
            }
        })
    }

    get trailerDict(): PdfDictionary<PdfTrailerEntries> {
        return this.xref.trailerDict
    }

    clone(): this {
        const clonedObjects = this.objects.map((obj) => obj.clone())
        return new PdfRevision({ objects: clonedObjects }) as this
    }

    protected tokenize(): PdfToken[] {
        return this.objects.flatMap((obj) => [
            ...obj.toTokens(),
            PdfWhitespaceToken.NEWLINE,
        ])
    }
}
