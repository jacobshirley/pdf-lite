import { PdfDictionary } from '../core/objects/pdf-dictionary'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfObject } from '../core/objects/pdf-object'
import { PdfTrailerEntries } from '../core/objects/pdf-trailer'
import { PdfToken } from '../core/tokens/token'
import { PdfWhitespaceToken } from '../core/tokens/whitespace-token'
import { PdfXrefLookup } from './pdf-xref-lookup'

/**
 * Represents a single revision of a PDF document.
 * PDF documents can have multiple revisions for incremental updates,
 * where each revision contains its own set of objects and cross-reference table.
 */
export class PdfRevision extends PdfObject {
    /** Objects contained in this revision */
    objects: PdfObject[] = []
    /** Cross-reference lookup table for this revision */
    xref: PdfXrefLookup
    /** Whether this revision is locked (cannot be modified) */
    locked: boolean = false


    /**
     * Creates a new PDF revision.
     *
     * @param options - Configuration options for the revision
     * @param options.objects - Initial objects for this revision
     * @param options.prev - Previous revision or xref lookup to link to
     * @param options.locked - Whether the revision should be locked initially
     */
    constructor(options?: {
        objects?: PdfObject[]
        prev?: PdfXrefLookup | PdfRevision
        locked?: boolean
    }) {
        super()
        this.modified = false
        this.objects = options?.objects ?? []

        this.xref = PdfXrefLookup.fromObjects(this.objects)

        if (options?.prev) this.setPrev(options.prev)
        if (!this.contains(this.xref.object))
            this.addObject(...this.xref.toTrailerSection())
        this.locked = options?.locked ?? false
    }

    /**
     * Links this revision to a previous revision's cross-reference table.
     *
     * @param xref - The previous revision's xref lookup or revision
     */
    setPrev(xref: PdfXrefLookup | PdfRevision) {
        xref = xref instanceof PdfRevision ? xref.xref : xref
        this.xref.setPrev(xref)
    }

    /**
     * Checks if an object reference exists in this revision.
     *
     * @param object - The object to check for
     * @returns True if the exact object instance exists in this revision
     */
    contains(object: PdfObject): boolean {
        return this.objects.includes(object)
    }

    /**
     * Checks if an equivalent object exists in this revision (by value equality).
     *
     * @param object - The object to check for
     * @returns True if an equal object exists in this revision
     */
    exists(object: PdfObject): boolean {
        for (const obj of this.objects) {
            if (obj.equals(object)) {
                return true
            }
        }
        return false
    }

    /**
     * Adds objects to the beginning of the revision's object list.
     *
     * @param objects - Objects to add at the beginning
     */
    unshift(...objects: PdfObject[]): void {
        for (const obj of objects.reverse()) {
            this.objects.unshift(obj)
            if (obj instanceof PdfIndirectObject) this.xref.addObject(obj)
        }
    }

    /**
     * Adds objects to the revision.
     *
     * @param objects - Objects to add to the revision
     */
    addObject(...objects: PdfObject[]): void {
        for (const obj of objects) {
            this.addObjectAt(obj)
        }
    }

    /**
     * Adds an object at a specific position in the revision.
     *
     * @param object - The object to add
     * @param index - Position to insert at (number) or object to insert before
     * @throws Error if the revision is locked or index is out of bounds
     */
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

        this.update()
    }

    /**
     * Removes objects from the revision.
     *
     * @param objects - Objects to remove from the revision
     * @throws Error if the revision is locked
     */
    deleteObject(...objects: PdfObject[]): void {
        if (this.locked) {
            throw new Error('Cannot delete object from locked PDF revision')
        }

        for (const object of objects) {
            const index = this.objects.indexOf(object)
            if (index === -1) {
                return
            }

            this.modified = true
            this.objects.splice(index, 1)

            if (object instanceof PdfIndirectObject) {
                this.xref.removeObject(object)
            }
        }
    }

    isModified(): boolean {
        return super.isModified() || this.xref.trailerDict.isModified() || this.objects.some((obj) => obj.isModified())
    }

    /**
     * Updates the revision by sorting objects and updating the xref table.
     */
    update(): void {
        if (this.locked) {
            return
        }
        this.sortObjects()
        this.xref.update()
        this.modified = false
    }

    /**
     * Sorts objects by their insertion order.
     * Indirect objects are placed before other objects.
     */
    sortObjects(): void {
        this.objects.sort((a, b) => {
            if (
                a instanceof PdfIndirectObject &&
                b instanceof PdfIndirectObject
            ) {
                return a.order() - b.order()
            } else {
                return 0
            }
        })
    }

    /**
     * Gets the trailer dictionary for this revision.
     *
     * @returns The trailer dictionary containing document metadata references
     */
    get trailerDict(): PdfDictionary<PdfTrailerEntries> {
        return this.xref.trailerDict
    }

    /**
     * Creates a deep copy of this revision.
     *
     * @returns A cloned PdfRevision instance
     */
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
