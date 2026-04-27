import { describe, expect, it } from 'vitest'
import { server } from 'vitest/browser'
import {
    PdfLazyObjectManager,
    PdfObjectManager,
} from '../../src/pdf/pdf-object-manager'
import {
    ByteArray,
    createStandardSecurityHandlerFromDictionary,
    PdfComment,
    PdfDictionary,
    PdfEncryptionDictionary,
    PdfIndirectObject,
    PdfStream,
    PdfString,
    PdfV4SecurityHandler,
} from '../../src'
import { bytesToString } from '../../src/utils'

const base64ToBytes = (base64: string): ByteArray => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
}

describe('PDF Lazy Object Manager', () => {
    it('should get the start XRef correctly', async () => {
        const pdfBytes = base64ToBytes(
            await server.commands.readFile(
                `./test/unit/fixtures/protectedAdobeLivecycle.pdf`,
                {
                    encoding: 'base64',
                },
            ),
        )

        const objectManager = new PdfLazyObjectManager(pdfBytes)
        const startXRef = objectManager.getStartXRef()
        expect(startXRef).toBe(104935)
    })

    it('should load the xref table/stream correctly', async () => {
        const pdfBytes = base64ToBytes(
            await server.commands.readFile(
                `./test/unit/fixtures/protectedAdobeLivecycle.pdf`,
                {
                    encoding: 'base64',
                },
            ),
        )

        const objectManager = new PdfLazyObjectManager(pdfBytes)
        const xrefObject = objectManager.getXrefObject()
        expect(xrefObject).toBeDefined()
    })

    it('should get objects by reference correctly', async () => {
        const pdfBytes = base64ToBytes(
            await server.commands.readFile(
                `./test/unit/fixtures/protectedAdobeLivecycle.pdf`,
                {
                    encoding: 'base64',
                },
            ),
        )

        const objectManager = new PdfLazyObjectManager(pdfBytes)
        const encryptionRef = objectManager
            .getXrefObject()
            .trailerDict.get('Encrypt')!
            .resolve(PdfIndirectObject<PdfEncryptionDictionary>)

        objectManager.securityHandler =
            createStandardSecurityHandlerFromDictionary(encryptionRef.content, {
                password: '',
                documentId: objectManager.getXrefObject().trailerDict.get('ID'),
            })

        const obj = objectManager.getObjectByReference({
            objectNumber: 59,
            generationNumber: 0,
        }) as PdfIndirectObject<PdfStream>
        console.log(obj.content.dataAsString)

        expect(obj).toBeDefined()
    })

    it('should be able to add objects', async () => {
        const objectManager = new PdfLazyObjectManager()

        objectManager.add(PdfComment.versionComment('2.0'))
        objectManager.add(
            new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({
                    Type: new PdfString('Example'),
                    Value: new PdfString('This is a test'),
                }),
            }),
        )
        objectManager.add(
            new PdfIndirectObject({
                objectNumber: 2,
                generationNumber: 1,
                content: new PdfDictionary({
                    Type: new PdfString('Example'),
                    Value: new PdfString('This is a test'),
                }),
            }),
        )
        objectManager.add(
            new PdfIndirectObject({
                objectNumber: 3,
                generationNumber: 1,
                content: new PdfDictionary({
                    Type: new PdfString('Example'),
                    Value: new PdfString('This is a test'),
                }),
            }),
        )
        objectManager.startNewRevision()
        objectManager.add(
            new PdfIndirectObject({
                objectNumber: 4,
                generationNumber: 1,
                content: new PdfDictionary({
                    Type: new PdfString('Example'),
                    Value: new PdfString('This is a test'),
                }),
            }),
        )

        objectManager.add(new PdfComment('test'))

        const str = objectManager.toString()
        expect(str).toMatchInlineSnapshot(`
          "%PDF-2.0
          1 0 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          2 1 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          3 1 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          xref
          0 4
          0000000000 65535 f
          0000000009 00000 n
          0000000070 00001 n
          0000000131 00001 n
          trailer
          <<>>
          startxref
          192
          %%EOF
          4 1 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          %test
          xref
          0 1
          0000000000 65535 f
          4 1
          0000000310 00001 n
          trailer
          << /Prev 192 >>
          startxref
          377
          %%EOF
          "
        `)
    })

    it.only('should be able to edit objects', async () => {
        const objectManager = new PdfLazyObjectManager()

        objectManager.add(PdfComment.versionComment('2.0'))
        objectManager.add(
            new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({
                    Type: new PdfString('Example'),
                    Value: new PdfString('This is a test'),
                }),
            }),
        )
        objectManager.add(
            new PdfIndirectObject({
                objectNumber: 2,
                generationNumber: 1,
                content: new PdfDictionary({
                    Type: new PdfString('Example'),
                    Value: new PdfString('This is a test'),
                }),
            }),
        )
        objectManager.add(
            new PdfIndirectObject({
                objectNumber: 3,
                generationNumber: 1,
                content: new PdfDictionary({
                    Type: new PdfString('Example'),
                    Value: new PdfString('This is a test'),
                }),
            }),
        )
        objectManager.startNewRevision()
        objectManager.add(
            new PdfIndirectObject({
                objectNumber: 4,
                generationNumber: 1,
                content: new PdfDictionary({
                    Type: new PdfString('Example'),
                    Value: new PdfString('This is a test'),
                }),
            }),
        )

        objectManager.add(new PdfComment('test'))

        const obj = objectManager
            .getObject(2, 1)
            .as(PdfIndirectObject<PdfDictionary>)
        obj.content.set('Value', new PdfString('This is an edited test'))
        console.log(obj.isModified())

        const appendStr = objectManager.toBytes('append')
        expect(bytesToString(appendStr)).toMatchInlineSnapshot(`
          "%PDF-2.0
          1 0 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          2 1 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          3 1 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          xref
          0 4
          0000000000 65535 f
          0000000009 00000 n
          0000000070 00001 n
          0000000131 00001 n
          trailer
          <<>>
          startxref
          192
          %%EOF
          4 1 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          %test
          2 1 obj
          << /Type (Example) /Value (This is an edited test) >>
          endobj
          xref
          0 1
          0000000000 65535 f
          2 1
          0000000377 00001 n
          4 1
          0000000310 00001 n
          trailer
          << /Prev 192 >>
          startxref
          446
          %%EOF
          "
        `)

        // Re-apply the edit since append consumed the modified flag
        obj.content.set('Value', new PdfString('This is an edited test'))

        const rewriteStr = objectManager.toBytes('rewrite')
        expect(bytesToString(rewriteStr)).toMatchInlineSnapshot(`
          "%PDF-2.0
          1 0 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          2 1 obj
          << /Type (Example) /Value (This is an edited test) >>
          endobj
          3 1 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          4 1 obj
          << /Type (Example) /Value (This is a test) >>
          endobj
          %test
          xref
          0 5
          0000000000 65535 f
          0000000009 00000 n
          0000000070 00001 n
          0000000139 00001 n
          0000000200 00001 n
          trailer
          <<>>
          startxref
          267
          %%EOF
          "
        `)
    })
})
