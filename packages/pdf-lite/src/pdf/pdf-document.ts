import { PdfObject } from '../core/objects/pdf-object.js'
import {
    PdfSecurityHandler,
    PdfStandardSecurityHandler,
} from '../security/handlers/base.js'
import { createFromDictionary } from '../security/handlers/utils.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfComment } from '../core/objects/pdf-comment.js'
import { PdfToken } from '../core/tokens/token.js'
import { PdfWhitespaceToken } from '../core/tokens/whitespace-token.js'
import {
    PdfObjStream,
    PdfStream,
    PdfXRefStreamCompressedEntry,
} from '../core/objects/pdf-stream.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfXrefLookup } from './pdf-xref-lookup.js'
import { PdfTokenSerializer } from '../core/serializer.js'
import { PdfRevision } from './pdf-revision.js'
import { PdfV5SecurityHandler } from '../security/handlers/v5.js'
import { PdfEncryptionDictionaryObject } from '../security/types.js'
import { PdfByteOffsetToken } from '../core/tokens/byte-offset-token.js'
import { PdfNumberToken } from '../core/tokens/number-token.js'
import { PdfXRefTableEntryToken } from '../core/tokens/xref-table-entry-token.js'
import { Ref } from '../core/ref.js'
import { PdfStartXRef } from '../core/objects/pdf-start-xref.js'
import { PdfTrailerEntries } from '../core/objects/pdf-trailer.js'
import { FoundCompressedObjectError } from './errors.js'
import { PdfDocumentSecurityStoreObject } from '../signing/document-security-store.js'
import { ByteArray } from '../types.js'
import { PdfReader } from './pdf-reader.js'
import { PdfDocumentVerificationResult, PdfSigner } from '../signing/signer.js'
import { PdfAcroFormManager } from '../acroform/manager.js'
import { PdfFontManager } from '../fonts/font-manager.js'
import { concatUint8Arrays } from '../utils/concatUint8Arrays.js'

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
    /** List of document revisions for incremental updates */
    revisions: PdfRevision[]
    /** Signer instance for digital signature operations */
    signer: PdfSigner
    /** Security handler for encryption/decryption operations */
    securityHandler?: PdfSecurityHandler

    /**  */
    readonly acroForm: PdfAcroFormManager
    readonly fonts: PdfFontManager

    private hasEncryptionDictionary?: boolean = false
    private toBeCommitted: PdfObject[] = []

    /**
     * Creates a new PDF document instance.
     *
     * @param options - Configuration options for the document
     * @param options.revisions - Pre-existing revisions for the document
     * @param options.version - PDF version string (e.g., '1.7', '2.0') or version comment
     * @param options.password - User password for encryption
     * @param options.ownerPassword - Owner password for encryption
     * @param options.securityHandler - Custom security handler for encryption
     * @param options.signer - Custom signer for digital signatures
     */
    constructor(options?: {
        revisions?: PdfRevision[]
        version?: string | PdfComment
        password?: string
        ownerPassword?: string
        securityHandler?: PdfSecurityHandler
        signer?: PdfSigner
    }) {
        super()

        this.revisions = options?.revisions ?? [new PdfRevision()]

        if (options?.version instanceof PdfComment) {
            this.header = options.version
        } else {
            this.setVersion(options?.version ?? '2.0')
        }
        if (options?.password) {
            this.setPassword(options.password)
        }

        if (options?.ownerPassword) {
            this.setOwnerPassword(options.ownerPassword)
        }

        this.signer = options?.signer ?? new PdfSigner()

        this.linkRevisions()
        this.calculateOffsets()

        this.securityHandler =
            options?.securityHandler ?? this.getSecurityHandler()

        this.acroForm = new PdfAcroFormManager(this)
        this.fonts = new PdfFontManager(this)
    }

    get header(): PdfComment | undefined {
        return this.revisions[0].header
    }

    set header(comment: PdfComment | undefined) {
        if (comment) this.revisions[0].header = comment
    }

    /**
     * Creates a PdfDocument from an array of PDF objects.
     * Parses objects into revisions based on EOF comments.
     *
     * @param objects - Array of PDF objects to construct the document from
     * @returns A new PdfDocument instance
     */
    static fromObjects(objects: PdfObject[]): PdfDocument {
        let header: PdfComment | undefined
        const revisions: PdfRevision[] = []
        let currentObjects: PdfObject[] = []

        for (const obj of objects) {
            if (obj instanceof PdfComment && obj.isVersionComment()) {
                header = obj
                continue
            }

            currentObjects.push(obj)
            if (obj instanceof PdfComment && obj.isEOFComment()) {
                revisions.push(new PdfRevision({ objects: currentObjects }))
                currentObjects = []
            }
        }

        if (currentObjects.length > 0) {
            revisions.push(new PdfRevision({ objects: currentObjects }))
        }

        return new PdfDocument({ revisions, version: header })
    }

    /**
     * Starts a new revision for incremental updates.
     * Creates a new revision linked to the previous one.
     *
     * @returns The document instance for method chaining
     */
    startNewRevision(): PdfDocument {
        const newRevision = new PdfRevision({ prev: this.latestRevision })
        this.revisions.push(newRevision)

        const lastStartXRef = this.objects.findLast(
            (x) => x instanceof PdfStartXRef,
        )

        if (lastStartXRef) {
            newRevision.xref.offset = lastStartXRef.offset.ref
        }

        return this
    }

    /**
     * Adds objects to the document's latest revision.
     * Automatically starts a new revision if the current one is locked.
     *
     * @param objects - PDF objects to add to the document
     */
    add(...objects: PdfObject[]): void {
        if (this.latestRevision.locked) {
            this.startNewRevision()
        }

        for (const obj of objects) {
            if (obj.isImmutable()) {
                throw new Error('Risky adding a immutable obj')
            }
            this.toBeCommitted.push(obj)
            this.latestRevision.addObject(obj)
        }
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
            const xref = this.latestRevision.xref
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
     * Gets the latest (most recent) revision of the document.
     *
     * @returns The latest PdfRevision
     * @throws Error if the revision for the last StartXRef cannot be found
     */
    get latestRevision(): PdfRevision {
        const lastStartXRef = this.objects.findLast(
            (x) => x instanceof PdfStartXRef,
        )
        if (!lastStartXRef) {
            return this.revisions[this.revisions.length - 1]
        }

        const revision =
            this.revisions.find(
                (rev) => rev.xref.offset === lastStartXRef.offset.ref,
            ) ??
            this.revisions.find((rev) =>
                rev.xref.offset.equals(lastStartXRef.offset.value),
            )
        if (!revision) {
            throw new Error(
                'Cannot find revision for last StartXRef with offset ' +
                    `${lastStartXRef.offset.value}. Options are: ` +
                    this.revisions
                        .map((rev) => rev.xref.offset.value)
                        .join(', '),
            )
        }

        return revision
    }

    /**
     * Gets the cross-reference lookup table for the latest revision.
     *
     * @returns The PdfXrefLookup for the latest revision
     */
    get xrefLookup(): PdfXrefLookup {
        return this.latestRevision.xref
    }

    /**
     * Gets the trailer dictionary from the cross-reference lookup.
     *
     * @returns The trailer dictionary containing document metadata references
     */
    get trailerDict(): PdfDictionary<PdfTrailerEntries> {
        return this.xrefLookup.trailerDict
    }

    /**
     * Gets all objects across all revisions in the document.
     *
     * @returns A readonly array of all PDF objects
     */
    get objects(): ReadonlyArray<PdfObject> {
        return this.revisions.flatMap((rev) => rev.objects)
    }

    /**
     * Gets the encryption dictionary from the document if present.
     *
     * @returns The encryption dictionary object or undefined if not encrypted
     * @throws Error if the encryption dictionary reference points to a non-dictionary object
     */
    get encryptionDictionary(): PdfEncryptionDictionaryObject | undefined {
        const encryptionDictionaryRef = this.trailerDict
            .get('Encrypt')
            ?.as(PdfObjectReference)

        if (!encryptionDictionaryRef) {
            return undefined
        }

        const encryptionDictObject = this.findUncompressedObject(
            encryptionDictionaryRef,
        )

        if (!(encryptionDictObject?.content instanceof PdfDictionary)) {
            throw new Error(
                `Encryption dictionary object ${encryptionDictionaryRef.objectNumber} ${encryptionDictionaryRef.generationNumber} is not a dictionary, it is a ${encryptionDictObject?.content.objectType}`,
            )
        }

        encryptionDictObject.encryptable = false
        return encryptionDictObject as PdfEncryptionDictionaryObject
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
        const rootRef = this.trailerDict.get('Root')?.as(PdfObjectReference)

        if (!rootRef) {
            const rootObject = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            this.add(rootObject)
            this.trailerDict.set('Root', rootObject.reference)
            return rootObject
        }

        const rootObject = this.findUncompressedObject(rootRef)

        if (!rootObject) {
            throw new Error('Root object not found')
        }

        if (!(rootObject?.content instanceof PdfDictionary)) {
            throw new Error(
                `Root object ${rootRef.objectNumber} ${rootRef.generationNumber} is not a dictionary, it is a ${rootObject?.content.objectType}`,
            )
        }

        return rootObject as PdfIndirectObject<PdfDictionary>
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

    private getSecurityHandler(): PdfSecurityHandler | undefined {
        const encryptionDictionaryRef = this.trailerDict
            .get('Encrypt')
            ?.as(PdfObjectReference)

        if (!encryptionDictionaryRef) {
            return undefined
        }

        const encryptionDictObject = this.findUncompressedObject(
            encryptionDictionaryRef,
        )

        if (!encryptionDictObject) {
            throw new Error('Encryption dictionary object not found')
        }

        if (!(encryptionDictObject?.content instanceof PdfDictionary)) {
            throw new Error(
                `Encryption dictionary object ${encryptionDictionaryRef.objectNumber} ${encryptionDictionaryRef.generationNumber} is not a dictionary, it is a ${encryptionDictObject?.content.objectType}`,
            )
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
        return this.objects.includes(obj)
    }

    private isObjectEncryptable(obj: PdfIndirectObject): boolean {
        if (!this.securityHandler) {
            return false
        }

        if (!obj.isEncryptable()) {
            return false
        }

        if (obj.matchesReference(this.encryptionDictionary?.reference)) {
            return false
        }

        if (
            !this.securityHandler.encryptMetadata &&
            obj.matchesReference(this.metadataStreamReference)
        ) {
            return false
        }

        return true
    }

    /**
     * Decrypts all encrypted objects in the document.
     * Removes the security handler and encryption dictionary after decryption.
     */
    async decrypt(): Promise<void> {
        if (!this.securityHandler) {
            return
        }

        for (const object of this.objects) {
            if (!(object instanceof PdfIndirectObject)) {
                continue
            }

            if (!this.isObjectEncryptable(object)) {
                continue
            }

            await this.securityHandler.decryptObject(object)
        }

        this.securityHandler = undefined
        this.hasEncryptionDictionary = false

        const encryptionDict = this.encryptionDictionary

        if (encryptionDict) {
            await this.deleteObject(encryptionDict)
        }

        await this.update()
    }

    /**
     * Encrypts all objects in the document using the security handler.
     * Creates and adds an encryption dictionary to all revisions.
     */
    async encrypt(): Promise<void> {
        this.initSecurityHandler({})

        await this.securityHandler!.write()

        for (const object of this.objects) {
            if (!(object instanceof PdfIndirectObject)) {
                continue
            }

            if (!this.isObjectEncryptable(object)) {
                continue
            }

            await this.securityHandler!.encryptObject(object)
        }

        const encryptionDictObject = new PdfIndirectObject({
            content: this.securityHandler!.dict,
            encryptable: false,
        })

        for (const revision of this.revisions) {
            revision.xref.trailerDict.set(
                'Encrypt',
                encryptionDictObject.reference,
            )

            if (!revision.xref.trailerDict.get('ID')) {
                revision.xref.trailerDict.set(
                    'ID',
                    this.securityHandler!.getDocumentId(),
                )
            }
        }

        await this.commit(encryptionDictObject)
        this.hasEncryptionDictionary = true

        await this.update()
    }

    /**
     * Finds a compressed object by its object number within an object stream.
     *
     * @param options - Object identifier with objectNumber and optional generationNumber
     * @returns The found indirect object or undefined if not found
     * @throws Error if the object cannot be found in the expected object stream
     */
    async findCompressedObject(
        options:
            | {
                  objectNumber: number
                  generationNumber?: number
              }
            | PdfObjectReference,
    ): Promise<PdfIndirectObject | undefined> {
        const xrefEntry = this.xrefLookup.getObject(options.objectNumber)

        if (!(xrefEntry instanceof PdfXRefStreamCompressedEntry)) {
            throw new Error(
                'Cannot find object inside object stream via PdfDocument.findObject',
            )
        }

        const objectStreamIndirect = this.findUncompressedObject({
            objectNumber: xrefEntry.objectStreamNumber.value,
        })?.clone()

        if (!objectStreamIndirect) {
            throw new Error(
                `Cannot find object stream ${xrefEntry.objectStreamNumber.value} for object ${options.objectNumber}`,
            )
        }

        if (
            this.securityHandler &&
            this.isObjectEncryptable(objectStreamIndirect)
        ) {
            await this.securityHandler.decryptObject(objectStreamIndirect)
        }

        const objectStream = objectStreamIndirect.content
            .as(PdfStream)
            .parseAs(PdfObjStream)

        const decompressedObject = objectStream.getObject({
            objectNumber: options.objectNumber,
        })

        return decompressedObject
    }

    /**
     * Finds an uncompressed indirect object by its object number.
     *
     * @param options - Object identifier with objectNumber and optional generationNumber
     * @returns The found indirect object or undefined if not found
     * @throws FoundCompressedObjectError if the object is compressed (in an object stream)
     */
    findUncompressedObject(
        options:
            | {
                  objectNumber: number
                  generationNumber?: number
              }
            | PdfObjectReference,
    ): PdfIndirectObject | undefined {
        const xrefEntry = this.xrefLookup.getObject(options.objectNumber)

        if (xrefEntry instanceof PdfXRefStreamCompressedEntry) {
            throw new FoundCompressedObjectError(
                `Cannot find object ${options.objectNumber} inside object stream via PdfDocument.findObject`,
            )
        }

        if (
            !xrefEntry ||
            (options.generationNumber !== undefined &&
                xrefEntry.generationNumber.value !== options.generationNumber)
        ) {
            return undefined
        }

        const found = this.objects.find(
            (obj) =>
                obj instanceof PdfIndirectObject &&
                obj.objectNumber === options.objectNumber &&
                (options.generationNumber === undefined ||
                    obj.generationNumber === options.generationNumber) &&
                obj.offset.equals(xrefEntry.byteOffset.ref),
        ) as PdfIndirectObject | undefined

        return found
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
    async readObject(options: {
        objectNumber: number
        generationNumber?: number
        allowUnindexed?: boolean
    }): Promise<PdfIndirectObject | undefined> {
        let foundObject: PdfIndirectObject | undefined

        try {
            foundObject = this.findUncompressedObject(options)
        } catch (e) {
            if (e instanceof FoundCompressedObjectError) {
                foundObject = await this.findCompressedObject(options)
            } else {
                throw e
            }
        }

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

        if (this.securityHandler && this.isObjectEncryptable(foundObject)) {
            foundObject = foundObject.clone()
            await this.securityHandler.decryptObject(foundObject)
        }

        return foundObject
    }
    /**
     * Deletes an object from all revisions in the document.
     *
     * @param obj - The PDF object to delete
     */
    async deleteObject(obj: PdfObject | undefined): Promise<void> {
        if (!obj) return

        for (const revision of this.revisions) {
            revision.deleteObject(obj)
        }

        await this.update()
    }

    /**
     * Sets the PDF version for the document.
     *
     * @param version - The PDF version string (e.g., '1.7', '2.0')
     * @throws Error if attempting to change version after objects have been added in incremental mode
     */
    setVersion(version: string): void {
        if (this.revisions[0].locked) {
            throw new Error(
                'Cannot change PDF version in incremental mode after objects have been added',
            )
        }

        this.header = PdfComment.versionComment(version)
    }

    /**
     * Sets whether the document should use incremental updates.
     * When true, locks all existing revisions to preserve original content.
     *
     * @param value - True to enable incremental mode, false to disable. Defaults to true.
     */
    setIncremental(value: boolean = true): void {
        if (value === this.isIncremental()) {
            return
        }

        for (const revision of this.revisions) {
            revision.locked = value
        }

        this.startNewRevision()
    }

    /**
     * Checks if the document is in incremental mode.
     *
     * @returns True if all revisions are locked for incremental updates
     */
    isIncremental(): boolean {
        return this.latestRevision.locked
    }

    /**
     * Commits pending objects to the document.
     * Adds objects, applies encryption if configured, and updates the document structure.
     *
     * @param newObjects - Additional objects to add before committing
     */
    async commit(...newObjects: PdfObject[]): Promise<void> {
        this.add(...newObjects)

        const queue = this.toBeCommitted.slice()
        this.toBeCommitted = []

        for (const newObject of queue) {
            if (
                this.securityHandler &&
                newObject instanceof PdfIndirectObject &&
                this.isObjectEncryptable(newObject)
            ) {
                await this.securityHandler.write()

                if (!this.hasEncryptionDictionary) {
                    const encryptionDictObject = new PdfIndirectObject({
                        content: this.securityHandler!.dict,
                        encryptable: false,
                    })

                    this.latestRevision.addObject(encryptionDictObject)
                    this.trailerDict.set(
                        'Encrypt',
                        encryptionDictObject.reference,
                    )
                    this.hasEncryptionDictionary = true
                }

                await this.securityHandler.encryptObject(newObject)
            }
        }

        await this.update()
    }

    /**
     * Sets the Document Security Store (DSS) for the document.
     * Used for long-term validation of digital signatures.
     *
     * @param dss - The Document Security Store object to set
     * @throws Error if the document has no root dictionary
     */
    async setDocumentSecurityStore(
        dss: PdfDocumentSecurityStoreObject,
    ): Promise<void> {
        let rootDictionary = this.root?.content
        if (!rootDictionary) {
            throw new Error('Cannot set DSS - document has no root dictionary')
        }
        rootDictionary.set('DSS', dss.reference)

        if (!this.hasObject(dss)) {
            await this.commit(dss)
        }
    }

    /**
     * Returns tokens paired with their source objects.
     * Useful for debugging and analysis of document structure.
     *
     * @returns Array of token-object pairs
     */
    tokensWithObjects(): {
        token: PdfToken
        object: PdfObject | undefined
    }[] {
        const documentTokens: {
            token: PdfToken
            object: PdfObject | undefined
        }[] = this.objects.flatMap((obj) => {
            const tokens = obj.toTokens()
            if (
                tokens.length > 0 &&
                !(tokens[tokens.length - 1] instanceof PdfWhitespaceToken)
            ) {
                tokens.push(PdfWhitespaceToken.NEWLINE)
            }
            return tokens.map((token) => ({ token, object: obj }))
        })

        return documentTokens
    }

    protected tokenize(): PdfToken[] {
        return this.tokensWithObjects().map(({ token }) => token)
    }

    private linkRevisions(): void {
        const xrefLookups = this.revisions.map((rev) => rev.xref)
        const indirectObjects = this.objects.filter(
            (x) => x instanceof PdfIndirectObject,
        )

        for (const revision of this.revisions) {
            revision.xref.linkPrev(xrefLookups)
            revision.xref.linkIndirectObjects(indirectObjects)
        }
    }

    private linkOffsets(): void {
        const refMap = new Map<
            number,
            {
                main?: Ref<number>
                others?: Set<Ref<number>>
            }
        >()

        const tokens = this.toTokens()

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]
            let main: Ref<number> | undefined
            let other: Ref<number> | undefined

            if (token instanceof PdfByteOffsetToken) {
                main = token.value
            } else if (token instanceof PdfXRefTableEntryToken) {
                other = token.offset.ref
            } else if (token instanceof PdfNumberToken && token.isByteToken) {
                other = token.ref
            }

            if (!other && !main) {
                continue
            }

            const id = (main ?? other)!.resolve()
            if (!refMap.has(id)) {
                refMap.set(id, { main: main, others: new Set<Ref<number>>() })
            }

            if (main) refMap.get(id)!.main = main
            if (other) refMap.get(id)!.others!.add(other)
        }

        for (const [, { main, others }] of refMap) {
            if (!main) continue

            for (const other of others ?? []) {
                other.update(main)
            }
        }
    }

    private calculateOffsets(): void {
        const serializer = new PdfTokenSerializer()
        serializer.feedMany(this.toTokens())
        serializer.calculateOffsets()
        this.linkOffsets()
    }

    private updateRevisions(): void {
        let modified = false
        this.revisions.forEach((rev, i) => {
            if (rev.isModified()) {
                modified = true
            }

            if (modified) {
                rev.update()
            }
        })
    }

    private async update(): Promise<void> {
        this.calculateOffsets()
        this.updateRevisions()
        await this.signer?.sign(this)
    }

    /**
     * Serializes the document to a byte array.
     *
     * @returns The PDF document as a Uint8Array
     */
    toBytes(): ByteArray {
        this.calculateOffsets()
        this.updateRevisions()
        return concatUint8Arrays(...this.revisions.map((x) => x.toBytes()))
    }

    /**
     * Serializes the document to a Base64-encoded string.
     *
     * @returns A promise that resolves to the PDF document as a Base64 string
     */
    toBase64(): string {
        const bytes = this.toBytes()
        let binary = ''
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
    }

    /**
     * Creates a deep copy of the document.
     *
     * @returns A cloned PdfDocument instance
     */
    cloneImpl(): this {
        const clonedRevisions = this.revisions.map((rev) => rev.clone())
        return new PdfDocument({
            revisions: clonedRevisions,
            version: this.header?.clone(),
            securityHandler: this.securityHandler,
        }) as this
    }

    /**
     * Creates a PdfDocument from a byte stream.
     *
     * @param input - Async or sync iterable of byte arrays
     * @returns A promise that resolves to the parsed PdfDocument
     */
    static fromBytes(
        input: AsyncIterable<ByteArray> | Iterable<ByteArray>,
    ): Promise<PdfDocument> {
        return PdfReader.fromBytes(input)
    }

    isModified(): boolean {
        return (
            super.isModified() || this.revisions.some((rev) => rev.isModified())
        )
    }

    /**
     * Verifies all digital signatures in the document.
     *
     * @returns A promise that resolves to the verification result
     */
    async verifySignatures(): Promise<PdfDocumentVerificationResult> {
        return await this.signer.verify(this)
    }
}
