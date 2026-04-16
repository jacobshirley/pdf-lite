import { describe, expect, it } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { PdfPasswordProtectedError } from '../../src/errors'

async function createEncryptedPdf(password: string): Promise<Uint8Array> {
    const doc = PdfDocument.newDocument()
    doc.setPassword(password)
    await doc.finalize()
    return doc.toBytes()
}

async function readDocument(
    bytes: Uint8Array,
    options?: {
        password?: string
        ownerPassword?: string
        incremental?: boolean
    },
): Promise<PdfDocument> {
    // Force TypeScript to treat this as ByteArray
    const byteArray = new Uint8Array(bytes.buffer) as Uint8Array<ArrayBuffer>
    return PdfDocument.fromBytes([byteArray], options)
}

describe('PdfPasswordProtectedError', () => {
    it('should throw PdfPasswordProtectedError when reading an encrypted PDF without a password', async () => {
        const encryptedBytes = await createEncryptedPdf('secret')

        await expect(readDocument(encryptedBytes)).rejects.toThrow(
            PdfPasswordProtectedError,
        )
    })

    it('should throw PdfPasswordProtectedError when reading an encrypted PDF in incremental mode without a password', async () => {
        const encryptedBytes = await createEncryptedPdf('secret')

        await expect(
            readDocument(encryptedBytes, { incremental: true }),
        ).rejects.toThrow(PdfPasswordProtectedError)
    })

    it('should not throw when the correct password is provided', async () => {
        const password = 'secret'
        const encryptedBytes = await createEncryptedPdf(password)

        const document = await readDocument(encryptedBytes, {
            password,
        })

        expect(document).toBeDefined()
        expect(document.securityHandler).toBeDefined()
    })

    it('should not throw for an unencrypted PDF', async () => {
        const document = PdfDocument.newDocument()
        const bytes = document.toBytes()

        const loaded = await readDocument(bytes)

        expect(loaded).toBeDefined()
        expect(loaded.securityHandler).toBeUndefined()
    })
})
