import { PdfObject } from '../core/objects/pdf-object.js'
import {
    PdfSecurityHandler,
    PdfStandardSecurityHandler,
} from '../security/handlers/base.js'
import { createFromDictionary } from '../security/handlers/utils.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfComment } from '../core/objects/pdf-comment.js'
import { PdfToken } from '../core/tokens/token.js'
import {
    PdfObjStream,
    PdfStream,
    PdfXRefStreamCompressedEntry,
} from '../core/objects/pdf-stream.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfName } from '../core/objects/pdf-name.js'
import {
    IPdfObjectResolver,
    PdfObjectReference,
} from '../core/objects/pdf-object-reference.js'
import { PdfXrefLookup } from './pdf-xref-lookup.js'
import { PdfObjectSerializer } from '../core/serializer.js'
import { PdfV5SecurityHandler } from '../security/handlers/v5.js'
import {
    PdfEncryptionDictionary,
    PdfEncryptionDictionaryObject,
} from '../security/types.js'
import { PdfStartXRef } from '../core/objects/pdf-start-xref.js'
import { PdfTrailerEntries } from '../core/objects/pdf-trailer.js'
import {
    FoundCompressedObjectError,
    PdfPasswordProtectedError,
} from '../errors.js'
import { PdfHexadecimal } from '../core/objects/pdf-hexadecimal.js'
import { ByteArray } from '../types.js'
import { getRandomBytes } from '../utils/algos.js'
import { PdfReader } from './pdf-reader.js'
import { PdfDocumentVerificationResult, PdfSigner } from '../signing/signer.js'
import { concatUint8Arrays } from '../utils/concatUint8Arrays.js'
import { PdfAcroForm } from '../acroform/pdf-acro-form.js'
import { PdfPages } from './pdf-pages.js'
import { PdfObjectStream } from '../index.js'
import { PdfObjectManager } from './pdf-object-manager.js'

/**
 * Represents a PDF document with support for reading, writing, and modifying PDF files.
 * Handles document structure, revisions, encryption, and digital signatures.
 *
 * @example
 * ```typescript
 * // Create a new document
 * const document = new PdfDocument()
 *
 * // Read from bytes
 * const document = await PdfDocument.fromBytes(fileBytes)
 *
 * // Add objects and commit
 * document.add(pdfObject)
 * await document.commit()
 * ```
 */
export class PdfDocument extends PdfObject {
    objectManager: PdfObjectManager
    /** Signer instance for digital signature operations */
    signer: PdfSigner
    /** List of document revisions for incremental updates */
    prev?: PdfDocument
    /** Security handler for encryption/decryption operations */
    securityHandler?: PdfSecurityHandler
    /** Whether the document is currently in incremental mode (appending changes as a new revision) */
    private incremental: boolean = false

    private originalSecurityHandler?: PdfSecurityHandler

    private hasEncryptionDictionary?: boolean = false
    private _committing = false
    private _finalized = false
    private _signed = false

    /**
     * Creates a new PDF document instance.
     *
     * @param options - Configuration options for the document
     * @param options.version - PDF version string (e.g., '1.7', '2.0') or version comment
     * @param options.password - User password for encryption
     * @param options.ownerPassword - Owner password for encryption
     * @param options.securityHandler - Custom security handler for encryption
     * @param options.signer - Custom signer for digital signatures
     */
    constructor(options?: {
        objectManager?: PdfObjectManager
        version?: string | PdfComment
        password?: string
        ownerPassword?: string
        securityHandler?: PdfSecurityHandler
        signer?: PdfSigner
    }) {
        super()

        this.objectManager =
            options?.objectManager ?? new PdfObjectManager(new Uint8Array())

        this.signer = options?.signer ?? new PdfSigner({ document: this })

        this.originalSecurityHandler = options?.securityHandler
        this.resetSecurityHandler()

        if (options?.password) {
            this.setPassword(options.password)
        }
        if (options?.ownerPassword) {
            this.setOwnerPassword(options.ownerPassword)
        }
    }

    getObject(
        objectNumber: number,
        generationNumber: number,
    ): PdfIndirectObject {
        return this.objectManager.getObject(objectNumber, generationNumber)
    }

    get acroform(): PdfAcroForm | null {
        const root = this.root
        const acroFormEntry = root.content.get('AcroForm')
        if (!acroFormEntry) return null
        const acroFormRef = acroFormEntry.as(PdfObjectReference)?.resolve()
        if (!acroFormRef) return null
        return acroFormRef.becomes(PdfAcroForm)
    }

    get pages(): PdfPages {
        const root = this.root
        const pagesEntry = root.content.get('Pages')
        if (pagesEntry) {
            const pagesRef = pagesEntry.as(PdfObjectReference)?.resolve()
            if (pagesRef) return pagesRef.becomes(PdfPages)
        }

        const pages = new PdfPages()
        this.add(pages)
        root.content.set('Pages', pages.reference)
        return pages
    }

    get header(): PdfComment | undefined {
        return this.objectManager.getObjectAtOffset(0)?.as(PdfComment)
    }

    set header(comment: PdfComment | undefined) {
        if (!comment) return
        this.objectManager.updateHeader(comment)
    }

    /**
     * Loads PDF objects into the document, organizing them into revisions.
     * Parses objects into revisions based on EOF comments.
     *
     * @param objects - Array of PDF objects to load into the document
     * @param options - Optional security and mode configuration
     * @param options.password - User password for encrypted documents
     * @param options.ownerPassword - Owner password for encrypted documents
     * @param options.incremental - Whether to use incremental mode
     */
    async loadObjects(options?: {
        password?: string
        ownerPassword?: string
        incremental?: boolean
    }): Promise<this> {
        // Reset security handler to detect and initialize encryption from the PDF
        // Preserve any passwords that were set before load() was called
        let presetPassword: string | undefined = options?.password
        let presetOwnerPassword: string | undefined = options?.ownerPassword
        if (this.securityHandler instanceof PdfStandardSecurityHandler) {
            const pw = this.securityHandler.getPassword()
            const opw = this.securityHandler.getOwnerPassword()
            if (!presetPassword && pw.length > 0) {
                presetPassword = new TextDecoder().decode(pw)
            }
            if (!presetOwnerPassword && opw) {
                presetOwnerPassword = new TextDecoder().decode(opw)
            }
        }
        this.resetSecurityHandler()

        // Apply passwords
        if (presetPassword) {
            this.setPassword(presetPassword)
        }
        if (presetOwnerPassword) {
            this.setOwnerPassword(presetOwnerPassword)
        }

        // Handle encryption/decryption
        let shouldDecrypt = Boolean(this.encryptionDictionary)
        const hasExplicitPassword = !!presetPassword || !!presetOwnerPassword

        // If encrypted, verify the password is valid before attempting decryption
        if (
            shouldDecrypt &&
            this.securityHandler instanceof PdfStandardSecurityHandler
        ) {
            const valid = await this.securityHandler.testPassword()
            if (!valid) {
                if (!hasExplicitPassword) {
                    throw new PdfPasswordProtectedError()
                }
                this.resetSecurityHandler()
                shouldDecrypt = false
            }
        }

        if (options?.incremental) {
            // Lock revisions first to preserve the original bytes
            // (including encrypted data) via cached tokens.
            this.setIncremental(true)

            // Then decrypt the live object data so built-in operations
            // (AcroForm, fonts, etc.) can read it. The cached tokens
            // still produce the original encrypted bytes on serialization.
            if (shouldDecrypt) {
                try {
                    await this.init()
                } catch (e) {
                    if (!hasExplicitPassword) {
                        throw new PdfPasswordProtectedError()
                    }
                    this.resetSecurityHandler()
                }
            }
        } else if (shouldDecrypt) {
            try {
                await this.init()
            } catch (e) {
                if (!hasExplicitPassword) {
                    throw new PdfPasswordProtectedError()
                }
                this.resetSecurityHandler()
            }
        }

        // Propagate the initialized security handler to the object manager
        // so lazy-parsed objects are automatically decrypted on access.
        this.objectManager.securityHandler = this.securityHandler

        return this
    }

    /**
     * Loads a PDF document from a byte stream, parsing it into objects and revisions.
     * @param input - Async or sync iterable of byte arrays representing the PDF file
     * @param options - Optional security and mode configuration
     * @returns A promise that resolves to the loaded PdfDocument instance
     */
    async load(
        input: ByteArray,
        options?: {
            password?: string
            ownerPassword?: string
            incremental?: boolean
        },
    ): Promise<this> {
        this.objectManager = new PdfObjectManager(input)
        return await this.loadObjects(options)
    }

    /**
     * Creates a new blank PDF document with a proper structure.
     * Sets up the document catalog, pages tree, and optionally adds an initial page.
     *
     * @param options - Configuration options for the new document
     * @param options.width - Width of the initial page (default: 612)
     * @param options.height - Height of the initial page (default: 792)
     * @param options.version - PDF version string (default: '1.7')
     * @returns A new PdfDocument instance with the basic structure
     */
    static newDocument(options?: {
        width?: number
        height?: number
        version?: string
    }): PdfDocument {
        const doc = new PdfDocument({ version: options?.version ?? '1.7' })

        // Create root catalog
        const catalogDict = new PdfDictionary()
        catalogDict.set('Type', new PdfName('Catalog'))
        const catalog = new PdfIndirectObject({
            content: catalogDict,
        })

        // Create pages tree
        const pagesTree = new PdfPages()

        // Link catalog to pages tree
        catalogDict.set('Pages', pagesTree.reference)

        // Add catalog and pages tree to document
        doc.add(catalog, pagesTree)

        // Set catalog as the root in trailer
        doc.trailerDict.set('Root', catalog.reference)

        // Generate a document ID (required for encryption with V1-V4 handlers)
        const idBytes = getRandomBytes(16)
        const docId = new PdfHexadecimal(idBytes, 'bytes')
        doc.trailerDict.set('ID', new PdfArray([docId, docId]))

        // Always add at least one page with the specified (or default) dimensions
        pagesTree.newPage({
            width: options?.width ?? 612,
            height: options?.height ?? 792,
        })

        return doc
    }

    /**
     * Starts a new revision for incremental updates.
     * Creates a new revision linked to the previous one.
     *
     * @returns The document instance for method chaining
     */
    startNewRevision(): PdfDocument {
        this.objectManager.write() // Creates a new revision
        return this
    }

    async init(): Promise<void> {
        await this.securityHandler?.initHandler?.()
    }

    /**
     * Adds objects to the document's latest revision.
     * Automatically starts a new revision if the current one is locked.
     *
     * @param objects - PDF objects to add to the document
     */
    add(...objects: PdfObject[]): void {
        this.objectManager.append(...objects)
    }

    /**
     * Creates a batch for adding multiple objects with a single update pass.
     * This is significantly faster than calling `add()` multiple times when
     * adding objects with many sub-references (e.g. fonts with descriptors,
     * CIDToGIDMap streams, ToUnicode CMaps).
     *
     * @example
     * ```typescript
     * const batch = document.batch()
     * batch.add(font1)
     * batch.add(font2)
     * batch.add(imageStream)
     * batch.commit()
     * ```
     *
     * @returns A PdfDocumentBatch instance
     */
    batch(): PdfDocumentBatch {
        return new PdfDocumentBatch(this)
    }

    /**
     * Packs non-stream indirect objects into compressed ObjStm containers.
     * Objects that already have an object number are left unchanged.
     * Appearance streams and other PdfStream objects must NOT be passed here —
     * only non-stream indirect objects (dictionaries, arrays, etc.) are eligible.
     *
     * @param objects - Non-stream indirect objects to compress into ObjStm
     * @param batchSize - Maximum objects per ObjStm container (default 100)
     */
    addObjectsAsStream(objects: PdfIndirectObject[], batchSize = 100): void {
        if (objects.length === 0) return

        for (let start = 0; start < objects.length; start += batchSize) {
            const batch = objects.slice(
                start,
                Math.min(start + batchSize, objects.length),
            )

            // Pre-assign a contiguous block of object numbers for the batch
            const xref = this.objectManager.getXrefObject()
            const startNum = xref.reserveObjectNumbers(batch.length)
            for (let i = 0; i < batch.length; i++) {
                if (!batch[i].inPdf()) {
                    batch[i].objectNumber = startNum + i
                }
            }

            // Build the ObjStm and apply FlateDecode compression
            const objStream = PdfObjStream.fromObjects(batch)
            objStream.addFilter('FlateDecode')

            // Add the container — xref.addObject() auto-registers children as type-2 entries
            const container = new PdfIndirectObject({ content: objStream })
            this.add(container)
        }
    }

    /**
     * Gets the trailer dictionary from the cross-reference lookup.
     *
     * @returns The trailer dictionary containing document metadata references
     */
    get trailerDict(): PdfDictionary<PdfTrailerEntries> {
        return this.objectManager.trailerDict
    }

    /**
     * Gets all objects across all revisions in the document.
     *
     * @returns A readonly array of all PDF objects
     */
    get objects(): ReadonlyArray<PdfObject> {
        return this.objectManager.getObjects()
    }

    /**
     * Gets the encryption dictionary from the document if present.
     *
     * @returns The encryption dictionary object or undefined if not encrypted
     * @throws Error if the encryption dictionary reference points to a non-dictionary object
     */
    get encryptionDictionary(): PdfEncryptionDictionaryObject | undefined {
        const encryptionDictionaryObject = this.trailerDict
            .get('Encrypt')
            ?.resolve(PdfIndirectObject<PdfEncryptionDictionary>)

        if (!encryptionDictionaryObject) {
            return undefined
        }

        encryptionDictionaryObject.encryptable = false
        return encryptionDictionaryObject
    }

    get rootReference(): PdfObjectReference {
        return this.root.reference
    }

    /**
     * Gets the document catalog (root) dictionary, or creates one if it doesn't exist.
     *
     * @returns The root dictionary
     * @throws Error if the Root reference points to a non-dictionary object
     */
    get root(): PdfIndirectObject<PdfDictionary> {
        const rootRef = this.trailerDict
            .get('Root')
            ?.resolve(PdfIndirectObject<PdfDictionary>)

        if (rootRef) {
            return rootRef
        }

        const rootObject = new PdfIndirectObject({
            content: new PdfDictionary(),
        })
        this.add(rootObject)
        this.trailerDict.set('Root', rootObject.reference)
        return rootObject
    }

    /**
     * Gets the reference to the metadata stream from the document catalog.
     *
     * @returns The metadata stream reference or undefined if not present
     */
    get metadataStreamReference(): PdfObjectReference | undefined {
        const root = this.root
        if (!root) {
            return
        }

        const metadataRef = root.content.get('Metadata')?.as(PdfObjectReference)

        if (!metadataRef) {
            return
        }

        return metadataRef
    }

    resetSecurityHandler(): void {
        this.securityHandler =
            this.originalSecurityHandler ?? this.getSecurityHandler()
    }

    private getSecurityHandler(): PdfSecurityHandler | undefined {
        const encryptionDictObject = this.encryptionDictionary

        if (!encryptionDictObject) {
            return undefined
        }

        this.hasEncryptionDictionary = true
        return createFromDictionary(encryptionDictObject.content, {
            documentId: this.trailerDict.get('ID'),
        })
    }

    private initSecurityHandler(options: {
        password?: string
        ownerPassword?: string
    }): void {
        if (this.securityHandler instanceof PdfStandardSecurityHandler) {
            const documentId = this.trailerDict.get('ID')
            options.password &&
                this.securityHandler.setPassword(options.password)
            options.ownerPassword &&
                this.securityHandler.setOwnerPassword(options.ownerPassword)
            documentId && this.securityHandler.setDocumentId(documentId)

            return
        }

        this.securityHandler = new PdfV5SecurityHandler({
            password: options.password,
            ownerPassword: options.ownerPassword,
        })
    }

    /**
     * Sets the user password for document encryption.
     *
     * @param password - The user password to set
     * @throws Error if the security handler doesn't support password setting
     */
    setPassword(password: string): void {
        if (this.securityHandler instanceof PdfStandardSecurityHandler) {
            this.securityHandler.setPassword(password)
        } else if (!this.securityHandler) {
            this.initSecurityHandler({ password })
        } else {
            throw new Error(
                'Setting password is only supported for Standard Security Handler',
            )
        }
    }

    /**
     * Sets the owner password for document encryption.
     *
     * @param ownerPassword - The owner password to set
     * @throws Error if the security handler doesn't support password setting
     */
    setOwnerPassword(ownerPassword: string): void {
        if (this.securityHandler instanceof PdfStandardSecurityHandler) {
            this.securityHandler.setOwnerPassword(ownerPassword)
        } else if (!this.securityHandler) {
            this.initSecurityHandler({ ownerPassword })
        } else {
            throw new Error(
                'Setting ownerPassword is only supported for Standard Security Handler',
            )
        }
    }

    /**
     * Checks if a PDF object exists in the document.
     *
     * @param obj - The PDF object to check
     * @returns True if the object exists in the document
     */
    hasObject(obj: PdfObject): boolean {
        //TODO
        return false
    }

    /**
     * Re-encrypts all objects and updates the document structure.
     * No-op if the document has no security handler (unencrypted document).
     */
    async finalize(): Promise<void> {
        if (this._finalized) {
            throw new Error('Document has already been finalized')
        }

        this._finalized = true

        await this.sign()
    }

    /**
     * Decrypts all encrypted objects in the document.
     * Removes the security handler and encryption dictionary after decryption.
     */
    async decrypt(): Promise<void> {
        if (!this.securityHandler) {
            return
        }

        await this.securityHandler.initHandler?.()

        //TODO: objectManager.removeEncryption()
    }

    /**
     * Encrypts all encryptable objects using the security handler.
     * Re-uses the existing encryption dictionary or creates one if needed,
     * propagating it to all revisions.
     */
    async encrypt(): Promise<void> {
        if (!this.securityHandler) {
            return
        }

        await this.securityHandler.initHandler?.()
        // NO OP: object manager handles this
    }

    /**
     * Reads and optionally decrypts an object by its object number.
     * Handles both compressed and uncompressed objects.
     *
     * @param options - Object lookup options
     * @param options.objectNumber - The object number to find
     * @param options.generationNumber - Optional generation number filter
     * @param options.allowUnindexed - If true, searches unindexed objects as fallback
     * @returns A cloned and decrypted copy of the object, or undefined if not found
     */
    readObject(options: {
        objectNumber: number
        generationNumber?: number
        allowUnindexed?: boolean
        cloned?: boolean
    }): PdfIndirectObject | undefined {
        let foundObject: PdfIndirectObject | undefined =
            this.objectManager.getObjectByReference({
                objectNumber: options.objectNumber,
                generationNumber: options.generationNumber,
            })

        if (!foundObject && options.allowUnindexed) {
            foundObject = this.objects.find(
                (obj) =>
                    obj instanceof PdfIndirectObject &&
                    obj.objectNumber === options.objectNumber &&
                    (options.generationNumber === undefined ||
                        obj.generationNumber === options.generationNumber),
            ) as PdfIndirectObject | undefined
        }

        if (!foundObject) {
            return undefined
        }

        if (options.cloned) {
            foundObject = foundObject.clone()
        }

        return foundObject
    }

    findUncompressedObject(options: {
        objectNumber: number
        generationNumber?: number
    }): PdfIndirectObject | undefined {
        return this.objectManager.getObjectByReference({
            objectNumber: options.objectNumber,
            generationNumber: options.generationNumber ?? 0,
        })
    }

    /**
     * Deletes an object from all revisions in the document.
     *
     * @param obj - The PDF object to delete
     */
    deleteObject(obj: PdfObject | undefined): void {
        if (!obj) return
        this.objectManager.delete(obj)
    }

    /**
     * Sets the PDF version for the document.
     *
     * @param version - The PDF version string (e.g., '1.7', '2.0')
     * @throws Error if attempting to change version after objects have been added in incremental mode
     */
    setVersion(version: string): void {
        this.header = PdfComment.versionComment(version)
    }

    /**
     * Sets whether the document should use incremental updates.
     * When true, locks all existing revisions to preserve original content.
     *
     * @param value - True to enable incremental mode, false to disable. Defaults to true.
     */
    setIncremental(value: boolean = true): void {
        //No op: currently only incremental mode is supported
        //TODO: support non-incremental writes (i.e. full PDF rewrite)
    }

    /**
     * Checks if the document is in incremental mode.
     *
     * @returns True if all revisions are locked for incremental updates
     */
    isIncremental(): boolean {
        return this.incremental
    }

    tokensWithObjects(): {
        token: PdfToken
        object: PdfObject | undefined
    }[] {
        return this.objectManager.tokensWithObjects()
    }

    protected tokenize(): PdfToken[] {
        return this.tokensWithObjects().map(({ token }) => token)
    }

    async sign() {
        if (this._signed) {
            throw new Error('Document has already been signed')
        }

        if (!this.signer) {
            return
        }

        await this.signer.sign()
        this._signed = true
    }

    /**
     * Serializes the document to a byte array.
     *
     * @returns The PDF document as a Uint8Array
     */
    toBytes(): ByteArray {
        return this.objectManager.toBytes()
    }

    /**
     * Creates a deep copy of the document.
     *
     * @returns A cloned PdfDocument instance
     */
    cloneImpl(): this {
        const bytes = this.toBytes()
        const cloned = new PdfDocument({
            securityHandler: this.securityHandler?.clone(),
        }) as this
        cloned.objectManager = new PdfObjectManager(bytes)
        cloned.hasEncryptionDictionary = this.hasEncryptionDictionary
        return cloned
    }

    toJSON() {
        return {
            type: 'document',
            objects: this.objects.map((obj) => obj.toJSON()),
        }
    }

    /**
     * Creates a PdfDocument from a byte stream.
     *
     * @param input - Async or sync iterable of byte arrays
     * @returns A promise that resolves to the parsed PdfDocument
     */
    static fromBytes(
        input: AsyncIterable<ByteArray> | Iterable<ByteArray>,
        options?: {
            password?: string
            ownerPassword?: string
            incremental?: boolean
        },
    ): Promise<PdfDocument> {
        return PdfReader.fromBytes(input, options)
    }

    isModified(): boolean {
        return super.isModified()
    }

    /**
     * Verifies all digital signatures in the document.
     *
     * @returns A promise that resolves to the verification result
     */
    async verifySignatures(): Promise<PdfDocumentVerificationResult> {
        return await this.signer.verify()
    }
}

/**
 * Batches multiple `add()` calls into a single update pass.
 * Created via {@link PdfDocument.batch}.
 */
export class PdfDocumentBatch {
    private _document: PdfDocument
    private _completed = false
    private _addedObjects: PdfObject[] = []

    /** @internal */
    constructor(document: PdfDocument) {
        this._document = document
    }

    /**
     * Adds one or more objects to the document.
     *
     * @param objects - PDF objects to add
     */
    add(...objects: PdfObject[]): this {
        if (this._completed) {
            throw new Error(
                'Batch already completed (committed or rolled back)',
            )
        }
        this._addedObjects.push(...objects)
        this._document.add(...objects)
        return this
    }

    /**
     * Commits the batch.
     */
    commit(): void {
        if (this._completed) {
            throw new Error(
                'Batch already completed (committed or rolled back)',
            )
        }
        this._completed = true
    }

    /**
     * Rolls back the batch, removing all objects that were added and
     * restoring the document to its state before the batch was created.
     */
    rollback(): void {
        if (this._completed) {
            throw new Error(
                'Batch already completed (committed or rolled back)',
            )
        }
        this._completed = true

        // Remove all objects that were added during this batch
        for (const obj of this._addedObjects) {
            this._document.deleteObject(obj)
        }
    }
}
