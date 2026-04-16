import { describe, expect, it } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { PdfPasswordProtectedError } from '../../src/errors'

async function createEncryptedPdf(password: string): Promise<Uint8Array> {
    const doc = PdfDocument.newDocument()
    doc.setPassword(password)
    await doc.finalize()
    return doc.toBytes()
}

describe('PdfPasswordProtectedError', () => {
    it('should throw PdfPasswordProtectedError when reading an encrypted PDF without a password', async () => {
        const encryptedBytes = await createEncryptedPdf('secret')

        await expect(PdfDocument.fromBytes([encryptedBytes])).rejects.toThrow(
            PdfPasswordProtectedError,
        )
    })

    it('should throw PdfPasswordProtectedError when reading an encrypted PDF in incremental mode without a password', async () => {
        const encryptedBytes = await createEncryptedPdf('secret')

        await expect(
            PdfDocument.fromBytes([encryptedBytes], { incremental: true }),
        ).rejects.toThrow(PdfPasswordProtectedError)
    })

    it('should not throw when the correct password is provided', async () => {
        const password = 'secret'
        const encryptedBytes = await createEncryptedPdf(password)

        const document = await PdfDocument.fromBytes([encryptedBytes], {
            password,
        })

        expect(document).toBeDefined()
        expect(document.securityHandler).toBeDefined()
    })

    it('should not throw for an unencrypted PDF', async () => {
        const document = PdfDocument.newDocument()
        const bytes = document.toBytes()

        const loaded = await PdfDocument.fromBytes([bytes])

        expect(loaded).toBeDefined()
        expect(loaded.securityHandler).toBeUndefined()
    })
})
