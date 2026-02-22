import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfPage, PdfPageOptions } from './pdf-page.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'

/**
 * Manager for PDF page operations within a PdfDocument.
 * Provides high-level methods for creating, accessing, and manipulating pages.
 *
 * Similar to PdfAcroFormManager, this class integrates with PdfDocument
 * to provide a clean API for page management: document.pages.create()
 */
export class PdfPageManager {
    private _document: PdfDocument

    constructor(document: PdfDocument) {
        this._document = document
    }

    /**
     * Creates a new page and adds it to the document's page tree.
     * The page is automatically added to the document and linked to the page tree.
     *
     * @param options - Page dimensions and optional properties
     * @returns The newly created page
     *
     * @example
     * ```typescript
     * const page = document.pages.create({ width: 612, height: 792 })
     * ```
     */
    create(options: PdfPageOptions): PdfPage {
        // Ensure catalog and page tree exist
        const catalog = this._document.root.content
        let rootPagesNode = this._getRootPagesNode(catalog)

        if (!rootPagesNode) {
            // Create new page tree
            rootPagesNode = this._createPagesNode()
            this._document.add(rootPagesNode)
            catalog.set('Pages', rootPagesNode.reference)
        }

        // Create the new page with parent reference
        const page = new PdfPage({
            ...options,
            parent: rootPagesNode.reference,
        })

        // Add page to document
        this._document.add(page)

        // Insert into page tree
        this._insertPageIntoTree(rootPagesNode, page, this.count())

        return page
    }

    /**
     * Gets a page by its zero-based index.
     *
     * @param index - Zero-based page index
     * @returns The page at the specified index, or undefined if out of bounds
     *
     * @example
     * ```typescript
     * const firstPage = document.pages.get(0)
     * ```
     */
    get(index: number): PdfPage | undefined {
        const catalog = this._document.root.content
        const rootPagesNode = this._getRootPagesNode(catalog)

        if (!rootPagesNode) {
            return undefined
        }

        return this._findPageByIndex(rootPagesNode.content, index)
    }

    /**
     * Returns the total number of pages in the document.
     * Reads the /Count entry from the root Pages node.
     *
     * @returns The number of pages, or 0 if no pages exist
     *
     * @example
     * ```typescript
     * console.log(`Document has ${document.pages.count()} pages`)
     * ```
     */
    count(): number {
        const catalog = this._document.root.content
        const rootPagesNode = this._getRootPagesNode(catalog)

        if (!rootPagesNode) {
            return 0
        }

        const countObj = rootPagesNode.content.get('Count')
        if (!countObj || !(countObj instanceof PdfNumber)) {
            return 0
        }

        return countObj.value
    }

    /**
     * Gets all pages in the document as an array.
     * Pages are returned in document order.
     *
     * @returns Array of all pages in the document
     *
     * @example
     * ```typescript
     * for (const page of document.pages.getAll()) {
     *     console.log(page.getDimensions())
     * }
     * ```
     */
    getAll(): PdfPage[] {
        const catalog = this._document.root.content
        const rootPagesNode = this._getRootPagesNode(catalog)

        if (!rootPagesNode) {
            return []
        }

        return this._getAllPages(rootPagesNode.content)
    }

    /**
     * Removes a page from the document at the specified index.
     * Updates the page tree and count accordingly.
     *
     * @param index - Zero-based page index to remove
     * @returns The removed page, or undefined if index was invalid
     *
     * @example
     * ```typescript
     * // Remove the first page
     * document.pages.remove(0)
     * ```
     */
    remove(index: number): PdfPage | undefined {
        const catalog = this._document.root.content
        const rootPagesNode = this._getRootPagesNode(catalog)

        if (!rootPagesNode) {
            return undefined
        }

        return this._removePageFromTree(rootPagesNode, index)
    }

    /**
     * Inserts a page into the document at the specified index.
     * If the index is greater than the page count, the page is appended.
     *
     * @param index - Zero-based insertion index
     * @param page - The page to insert
     *
     * @example
     * ```typescript
     * const newPage = new PdfPage({ width: 612, height: 792 })
     * document.add(newPage)
     * document.pages.insert(0, newPage) // Insert at beginning
     * ```
     */
    insert(index: number, page: PdfPage): void {
        const catalog = this._document.root.content
        let rootPagesNode = this._getRootPagesNode(catalog)

        if (!rootPagesNode) {
            // Create new page tree
            rootPagesNode = this._createPagesNode()
            this._document.add(rootPagesNode)
            catalog.set('Pages', rootPagesNode.reference)
        }

        // Ensure page is added to document
        if (page.objectNumber === -1) {
            this._document.add(page)
        }

        this._insertPageIntoTree(rootPagesNode, page, index)
    }

    /**
     * Iterates over all pages in the document.
     *
     * @example
     * ```typescript
     * for (const page of document.pages) {
     *     console.log(`Page size: ${page.getDimensions()?.width}x${page.getDimensions()?.height}`)
     * }
     * ```
     */
    *[Symbol.iterator](): Iterator<PdfPage> {
        const pages = this.getAll()
        for (const page of pages) {
            yield page
        }
    }

    // Private helper methods for page tree manipulation

    private _getRootPagesNode(
        catalog: PdfDictionary,
    ): PdfIndirectObject<PdfDictionary> | undefined {
        const pagesRef = catalog.get('Pages') as PdfObjectReference | undefined
        if (!pagesRef) {
            return undefined
        }

        const pagesObj = this._document.findUncompressedObject(pagesRef)
        if (!pagesObj || !(pagesObj.content instanceof PdfDictionary)) {
            return undefined
        }

        return pagesObj as PdfIndirectObject<PdfDictionary>
    }

    private _createPagesNode(
        kids: PdfArray = new PdfArray(),
    ): PdfIndirectObject<PdfDictionary> {
        const pagesDict = new PdfDictionary()
        pagesDict.set('Type', new PdfName('Pages'))
        pagesDict.set('Kids', kids)
        pagesDict.set('Count', new PdfNumber(0))

        return new PdfIndirectObject({ content: pagesDict })
    }

    private _updatePageCount(pagesNode: PdfDictionary): number {
        const kids = pagesNode.get('Kids') as PdfArray | undefined
        if (!kids) {
            pagesNode.set('Count', new PdfNumber(0))
            return 0
        }

        let count = 0
        for (let i = 0; i < kids.length; i++) {
            const kidRef = kids.items[i] as PdfObjectReference | undefined
            if (!kidRef) continue

            const kidObj = this._document.findUncompressedObject(kidRef)
            if (!kidObj || !(kidObj.content instanceof PdfDictionary)) continue

            const kidDict = kidObj.content
            const type = kidDict.get('Type') as PdfName | undefined

            if (type?.value === 'Pages') {
                count += this._updatePageCount(kidDict)
            } else if (type?.value === 'Page') {
                count++
            }
        }

        pagesNode.set('Count', new PdfNumber(count))
        return count
    }

    private _findPageByIndex(
        rootNode: PdfDictionary,
        index: number,
    ): PdfPage | undefined {
        let currentIndex = 0

        const traverse = (node: PdfDictionary): PdfPage | undefined => {
            const kids = node.get('Kids') as PdfArray | undefined
            if (!kids) return undefined

            for (let i = 0; i < kids.length; i++) {
                const kidRef = kids.items[i] as PdfObjectReference | undefined
                if (!kidRef) continue

                const kidObj = this._document.findUncompressedObject(kidRef)
                if (!kidObj || !(kidObj.content instanceof PdfDictionary))
                    continue

                const kidDict = kidObj.content
                const type = kidDict.get('Type') as PdfName | undefined

                if (type?.value === 'Pages') {
                    const result = traverse(kidDict)
                    if (result) return result
                } else if (type?.value === 'Page') {
                    if (currentIndex === index) {
                        return new PdfPage(
                            kidObj as PdfIndirectObject<PdfDictionary>,
                        )
                    }
                    currentIndex++
                }
            }

            return undefined
        }

        return traverse(rootNode)
    }

    private _getAllPages(rootNode: PdfDictionary): PdfPage[] {
        const pages: PdfPage[] = []

        const traverse = (node: PdfDictionary): void => {
            const kids = node.get('Kids') as PdfArray | undefined
            if (!kids) return

            for (let i = 0; i < kids.length; i++) {
                const kidRef = kids.items[i] as PdfObjectReference | undefined
                if (!kidRef) continue

                const kidObj = this._document.findUncompressedObject(kidRef)
                if (!kidObj || !(kidObj.content instanceof PdfDictionary))
                    continue

                const kidDict = kidObj.content
                const type = kidDict.get('Type') as PdfName | undefined

                if (type?.value === 'Pages') {
                    traverse(kidDict)
                } else if (type?.value === 'Page') {
                    pages.push(
                        new PdfPage(kidObj as PdfIndirectObject<PdfDictionary>),
                    )
                }
            }
        }

        traverse(rootNode)
        return pages
    }

    private _insertPageIntoTree(
        rootNode: PdfIndirectObject<PdfDictionary>,
        page: PdfPage,
        index: number,
    ): void {
        const rootDict = rootNode.content
        const kids = rootDict.get('Kids') as PdfArray | undefined

        page.parent = rootNode.reference as PdfObjectReference

        if (!kids || kids.length === 0) {
            rootDict.set(
                'Kids',
                new PdfArray([page.reference as PdfObjectReference]),
            )
            this._updatePageCount(rootDict)
            return
        }

        const count = (rootDict.get('Count') as PdfNumber)?.value ?? 0

        if (index >= count) {
            kids.push(page.reference as PdfObjectReference)
        } else {
            const allPages = this._getAllPages(rootDict)
            const newKids = new PdfArray()

            for (let i = 0; i <= allPages.length; i++) {
                if (i === index) {
                    newKids.push(page.reference as PdfObjectReference)
                }
                if (i < allPages.length) {
                    const existingPage = allPages[i]
                    newKids.push(existingPage.reference as PdfObjectReference)
                    existingPage.parent =
                        rootNode.reference as PdfObjectReference
                }
            }

            rootDict.set('Kids', newKids)
        }

        this._updatePageCount(rootDict)
    }

    private _removePageFromTree(
        rootNode: PdfIndirectObject<PdfDictionary>,
        index: number,
    ): PdfPage | undefined {
        const allPages = this._getAllPages(rootNode.content)

        if (index < 0 || index >= allPages.length) {
            return undefined
        }

        const removedPage = allPages[index]

        const newKids = new PdfArray()
        for (let i = 0; i < allPages.length; i++) {
            if (i !== index) {
                const page = allPages[i]
                newKids.push(page.reference as PdfObjectReference)
            }
        }

        rootNode.content.set('Kids', newKids)
        this._updatePageCount(rootNode.content)

        return removedPage
    }
}
