import { PdfObject } from '../core/objects/pdf-object'
import {
    PdfSecurityHandler,
    PdfStandardSecurityHandler,
} from '../security/handlers/base'
import { createFromDictionary } from '../security/handlers/utils'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfComment } from '../core/objects/pdf-comment'
import { PdfToken } from '../core/tokens/token'
import { PdfWhitespaceToken } from '../core/tokens/whitespace-token'
import {
    PdfObjStream,
    PdfStream,
    PdfXRefStreamCompressedEntry,
} from '../core/objects/pdf-stream'
import { PdfDictionary } from '../core/objects/pdf-dictionary'
import { PdfObjectReference } from '../core/objects/pdf-object-reference'
import { PdfXrefLookup } from './pdf-xref-lookup'
import { PdfTokenSerializer } from '../core/serializer'
import { PdfRevision } from './pdf-revision'
import { V5SecurityHandler } from '../security/handlers/v5'
import { PdfEncryptionDictionaryObject } from '../security/types'
import { PdfByteOffsetToken } from '../core/tokens/byte-offset-token'
import { PdfNumberToken } from '../core/tokens/number-token'
import { PdfXRefTableEntryToken } from '../core/tokens/xref-table-entry-token'
import { Ref } from '../core/ref'
import { PdfStartXRef } from '../core/objects/pdf-start-xref'
import { PdfTrailerEntries } from '../core/objects/pdf-trailer'
import { FoundCompressedObjectError } from './errors'
import { PdfDocumentSecurityStoreObject } from '../signing/document-security-store'
import { ByteArray } from '../types'
import { PdfReader } from './pdf-reader'
import { PdfSigner } from '../signing/signer'

export class PdfDocument extends PdfObject {
    header: PdfComment = PdfComment.versionComment('1.7')
    revisions: PdfRevision[]
    signer: PdfSigner
    securityHandler?: PdfSecurityHandler

    private hasEncryptionDictionary?: boolean = false
    private toBeCommitted: PdfObject[] = []

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

        this.securityHandler =
            options?.securityHandler ?? this.getSecurityHandler()

        if (options?.password) {
            this.setPassword(options.password)
        }

        if (options?.ownerPassword) {
            this.setOwnerPassword(options.ownerPassword)
        }

        this.signer = options?.signer ?? new PdfSigner()

        this.linkRevisions()
        this.calculateOffsets()
    }

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

    add(...objects: PdfObject[]): void {
        if (this.latestRevision.locked) {
            this.startNewRevision()
        }

        for (const obj of objects) {
            this.toBeCommitted.push(obj)
            this.latestRevision.addObject(obj)
        }
    }

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
            throw new Error('Cannot find revision for last StartXRef')
        }

        return revision
    }

    get xrefLookup(): PdfXrefLookup {
        return this.latestRevision.xref
    }

    get trailerDict(): PdfDictionary<PdfTrailerEntries> {
        return this.xrefLookup.trailerDict
    }

    get objects(): ReadonlyArray<PdfObject> {
        return this.revisions.flatMap((rev) => rev.objects)
    }

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

    get rootDictionary(): PdfDictionary | undefined {
        const rootRef = this.trailerDict.get('Root')?.as(PdfObjectReference)

        if (!rootRef) {
            return undefined
        }

        const rootObject = this.findUncompressedObject(rootRef)

        if (!(rootObject?.content instanceof PdfDictionary)) {
            throw new Error(
                `Root object ${rootRef.objectNumber} ${rootRef.generationNumber} is not a dictionary, it is a ${rootObject?.content.objectType}`,
            )
        }

        return rootObject.content
    }

    get metadataStreamReference(): PdfObjectReference | undefined {
        const root = this.rootDictionary
        if (!root) {
            return
        }

        const metadataRef = root.get('Metadata')?.as(PdfObjectReference)

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

        this.securityHandler = new V5SecurityHandler({
            password: options.password,
            ownerPassword: options.ownerPassword,
        })
    }

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
        })

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
                'TODO: Cannot find object inside object stream via PdfDocument.findObject',
            )
        }

        if (
            !xrefEntry ||
            (options.generationNumber !== undefined &&
                xrefEntry.generationNumber.value !== options.generationNumber)
        ) {
            return undefined
        }

        return this.objects.find(
            (obj) =>
                obj instanceof PdfIndirectObject &&
                obj.objectNumber === options.objectNumber &&
                (options.generationNumber === undefined ||
                    obj.generationNumber === options.generationNumber) &&
                obj.offset.equals(xrefEntry.byteOffset.ref),
        ) as PdfIndirectObject | undefined
    }

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
            foundObject = this.objects
                .find(
                    (obj) =>
                        obj instanceof PdfIndirectObject &&
                        obj.objectNumber === options.objectNumber &&
                        (options.generationNumber === undefined ||
                            obj.generationNumber === options.generationNumber),
                )
                ?.clone() as PdfIndirectObject | undefined
        }

        if (!foundObject) {
            return undefined
        }

        foundObject = foundObject.clone()

        if (this.securityHandler && this.isObjectEncryptable(foundObject)) {
            await this.securityHandler.decryptObject(foundObject)
        }

        return foundObject
    }

    async deleteObject(obj: PdfObject | undefined): Promise<void> {
        if (!obj) return

        for (const revision of this.revisions) {
            revision.deleteObject(obj)
        }

        await this.update()
    }

    setVersion(version: string): void {
        if (this.revisions[0].locked) {
            throw new Error(
                'Cannot change PDF version in incremental mode after objects have been added',
            )
        }

        this.header = PdfComment.versionComment(version)
    }

    setIncremental(value: boolean): void {
        for (const revision of this.revisions) {
            revision.locked = value
        }
    }

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

    async setDocumentSecurityStore(
        dss: PdfDocumentSecurityStoreObject,
    ): Promise<void> {
        let rootDictionary = this.rootDictionary
        if (!rootDictionary) {
            throw new Error('Cannot set DSS - document has no root dictionary')
        }
        rootDictionary.set('DSS', dss.reference)

        if (!this.hasObject(dss)) {
            await this.commit(dss)
        }
    }

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

        const headerTokens = this.header
            .toTokens()
            .map((token) => ({ token, object: this.header }))

        documentTokens.unshift(...headerTokens)

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
        serializer.feed(...this.toTokens())
        serializer.calculateOffsets()
        this.linkOffsets()
        this.revisions.forEach((rev) => rev.update())
    }

    private async update(): Promise<void> {
        this.revisions.forEach((rev) => rev.update())
        this.calculateOffsets()
        await this.signer?.sign(this)
    }

    toBytes(): ByteArray {
        const serializer = new PdfTokenSerializer()
        serializer.feed(...this.toTokens())
        return serializer.toBytes()
    }

    clone(): this {
        const clonedRevisions = this.revisions.map((rev) => rev.clone())
        return new PdfDocument({
            revisions: clonedRevisions,
            version: this.header.clone(),
            securityHandler: this.securityHandler,
        }) as this
    }

    static fromBytes(
        input: AsyncIterable<ByteArray> | Iterable<ByteArray>,
    ): Promise<PdfDocument> {
        return PdfReader.fromBytes(input)
    }
}
