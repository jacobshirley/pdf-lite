import { PdfTokenSerializer } from '../../../src/core/serializer.js'
import { PdfIndirectObject } from '../../../src/core/objects/pdf-indirect-object.js'
import { PdfDictionary } from '../../../src/core/objects/pdf-dictionary.js'
import { PdfName } from '../../../src/core/objects/pdf-name.js'
import { describe, it, expect } from 'vitest'
import {
    PdfXRefTable,
    PdfXRefTableEntry,
} from '../../../src/core/objects/pdf-xref-table.js'
import { PdfWhitespaceToken } from '../../../src/core/tokens/whitespace-token.js'

describe('PDF Serializer', () => {
    it('should turn a stream of PDF tokens into a byte array', () => {
        const tokenSerializer = new PdfTokenSerializer()
        tokenSerializer.feed(
            ...new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({
                    Type: new PdfName('Example'),
                }),
            }).toTokens(),
        )

        const bytes = new Uint8Array(tokenSerializer.nextItems())
        const str = new TextDecoder().decode(bytes)

        const expected = `1 0 obj
<< /Type /Example >>
endobj`
        expect(str).toBe(expected)
    })

    it('should update byte offset tokens with the correct offset', () => {
        const tokenSerializer = new PdfTokenSerializer()
        const obj1 = new PdfIndirectObject({
            objectNumber: 1,
            generationNumber: 0,
            //offset: 100,
            content: new PdfDictionary({
                Type: new PdfName('First'),
            }),
        })

        const xrefTable = new PdfXRefTable({
            entries: [
                new PdfXRefTableEntry({
                    objectNumber: 1,
                    generationNumber: 0,
                    byteOffset: obj1.offset,
                    inUse: true,
                }),
            ],
        })

        tokenSerializer.feed(PdfWhitespaceToken.NEWLINE)
        tokenSerializer.feed(PdfWhitespaceToken.NEWLINE)
        tokenSerializer.feed(PdfWhitespaceToken.NEWLINE)
        tokenSerializer.feed(...obj1.toTokens())
        tokenSerializer.feed(PdfWhitespaceToken.NEWLINE)
        tokenSerializer.feed(...xrefTable.toTokens())

        const bytes = new Uint8Array(tokenSerializer.nextItems())
        const str = new TextDecoder().decode(bytes)

        expect(obj1.offset.value).toBe(3) // Two newlines before the object
        expect(xrefTable.entries[0].byteOffset.value).toBe(3)

        expect(str).toMatchInlineSnapshot(`
          "


          1 0 obj
          << /Type /First >>
          endobj
          xref
          1 1
          0000000003 00000 n"
        `)
    })
})
