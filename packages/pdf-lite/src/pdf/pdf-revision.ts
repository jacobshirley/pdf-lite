import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfObject } from '../core/objects/pdf-object.js'
import { PdfTrailerEntries } from '../core/objects/pdf-trailer.js'
import { PdfToken } from '../core/tokens/token.js'
import { PdfWhitespaceToken } from '../core/tokens/whitespace-token.js'
import { PdfComment } from '../index.js'
import { ByteArray } from '../types.js'
import { PdfXrefLookup } from './pdf-xref-lookup.js'

/**
 * Represents a single revision of a PDF document.
 * PDF documents can have multiple revisions for incremental updates,
 * where each revision contains its own set of objects and cross-reference table.
 */
export class PdfRevision extends PdfObject {
    /** Objects contained in this revision (private backing field) */
    private _objects: PdfObject[] = []
    /** Whether this revision is locked (private backing field) */
    private _locked: boolean = false
    /** Cross-reference lookup table for this revision */
    xref: PdfXrefLookup

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
        this._objects = options?.objects ?? []

        this.xref = PdfXrefLookup.fromObjects(this._objects)

        if (options?.prev) this.setPrev(options.prev)
        if (!this.contains(this.xref.object))
            this.addObject(...this.xref.toTrailerSection())
        this._locked = options?.locked ?? false
    }

    get header(): PdfComment | undefined {
        const firstObj = this._objects[0]
        if (firstObj instanceof PdfComment && firstObj.isVersionComment()) {
            return firstObj
        }
        return undefined
    }

    set header(comment: PdfComment) {
        if (this._locked) {
            throw new Error('Cannot modify header in locked PDF revision')
        }

        const currentHeader = this.header
        if (currentHeader) {
            this._objects[0] = comment
        } else this._objects.unshift(comment)
    }

    /**
     * Gets whether this revision is locked (cannot be modified).
     */
    get locked(): boolean {
        return this._locked
    }

    /**
     * Sets whether this revision is locked.
     * When locking, creates a cached clone of all objects to freeze their state.
     * When unlocking, clears the cache.
     */
    set locked(value: boolean) {
        this._locked = value
        for (const obj of this._objects) {
            obj.setImmutable(value)
        }
    }

    /**
     * Gets the objects in this revision.
     * Returns fresh clones of cached objects if the revision is locked, otherwise returns live objects.
     * Each access to a locked revision's objects returns new clones to prevent mutations.
     */
    get objects(): ReadonlyArray<PdfObject> {
        return this._objects
    }

    /**
     * Sets the objects array.
     * @throws Error if the revision is locked
     */
    set objects(value: PdfObject[]) {
        if (this._locked) {
            throw new Error('Cannot modify objects array in locked revision')
        }
        this._objects = value
    }

    get indirectObjects(): PdfIndirectObject[] {
        return this._objects.filter(
            (obj): obj is PdfIndirectObject => obj instanceof PdfIndirectObject,
        )
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
        return this._objects.includes(object)
    }

    /**
     * Checks if an equivalent object exists in this revision (by value equality).
     *
     * @param object - The object to check for
     * @returns True if an equal object exists in this revision
     */
    exists(object: PdfObject): boolean {
        for (const obj of this._objects) {
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
     * @throws Error if the revision is locked
     */
    unshift(...objects: PdfObject[]): void {
        if (this._locked) {
            throw new Error('Cannot add object to locked PDF revision')
        }
        for (const obj of objects.reverse()) {
            this._objects.unshift(obj)
            if (obj instanceof PdfIndirectObject) this.xref.addObject(obj)
        }
    }

    /**
     * Adds objects to the revision.
     *
     * @param objects - Objects to add to the revision
     * @throws Error if the revision is locked
     */
    addObject(...objects: PdfObject[]): void {
        if (this._locked) {
            throw new Error('Cannot add object to locked PDF revision')
        }
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
        if (this._locked) {
            throw new Error('Cannot add object to locked PDF revision')
        }

        if (index === undefined) {
            index =
                object instanceof PdfIndirectObject
                    ? this.xref.object
                    : this._objects.length
        }

        if (typeof index !== 'number') {
            index = this._objects.indexOf(index)

            if (index === -1) {
                index = this._objects.length
            }
        }

        if (index < 0 || index > this._objects.length) {
            throw new Error('Index out of bounds')
        }

        this._objects.splice(index, 0, object)
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
        if (this._locked) {
            throw new Error('Cannot delete object from locked PDF revision')
        }

        for (const object of objects) {
            const index = this._objects.indexOf(object)
            if (index === -1) {
                return
            }

            this.modified = true
            this._objects.splice(index, 1)

            if (object instanceof PdfIndirectObject) {
                this.xref.removeObject(object)
            }
        }
    }

    isModified(): boolean {
        return (
            super.isModified() ||
            this.xref.trailerDict.isModified() ||
            this._objects.some((obj) => obj.isModified())
        )
    }

    /**
     * Updates the revision by sorting objects and updating the xref table.
     */
    update(): void {
        if (this._locked) {
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
        this._objects.sort((a, b) => {
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
    cloneImpl(): this {
        const clonedObjects = this.objects.map((obj) => obj.clone())
        return new PdfRevision({ objects: clonedObjects }) as this
    }

    protected tokenize(): PdfToken[] {
        const output = this.objects.flatMap((obj) => {
            const objTokens = obj.toTokens()
            if (
                !(objTokens[objTokens.length - 1] instanceof PdfWhitespaceToken)
            ) {
                objTokens.push(new PdfWhitespaceToken('\n'))
            }
            return objTokens
        })

        return output
    }

    isEmpty(): boolean {
        return (
            this.indirectObjects.length < 1 ||
            (this.indirectObjects.length === 1 &&
                this.indirectObjects[0] === this.xref.object)
        )
    }
}
