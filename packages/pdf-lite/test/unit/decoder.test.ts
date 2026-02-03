import { describe, expect, it } from 'vitest'
import { pdfDecoder } from '../../src/core/generators.js'
import { stringToBytes } from '../../src/utils/stringToBytes.js'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary.js'
import { PdfNumber } from '../../src/core/objects/pdf-number.js'
import { PdfArray } from '../../src/core/objects/pdf-array.js'
import { PdfObject } from '../../src/core/objects/pdf-object.js'
import { PdfName } from '../../src/core/objects/pdf-name.js'
import { PdfObjectReference } from '../../src/core/objects/pdf-object-reference.js'
import { PdfStream } from '../../src/core/objects/pdf-stream.js'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object.js'
import { PdfHexadecimal } from '../../src/core/objects/pdf-hexadecimal.js'
import { PdfString } from '../../src/core/objects/pdf-string.js'
import { PdfCommentToken } from '../../src/core/tokens/comment-token.js'
import { PdfTrailer } from '../../src/core/objects/pdf-trailer.js'
import {
    PdfXRefTable,
    PdfXRefTableEntry,
    PdfXRefTableSectionHeader,
} from '../../src/core/objects/pdf-xref-table.js'
import { PdfComment } from '../../src/core/objects/pdf-comment.js'
import { PdfStartXRef } from '../../src/core/objects/pdf-start-xref.js'
import { PdfWhitespaceToken } from '../../src/core/tokens/whitespace-token.js'
import { ByteArray } from '../../src/types.js'

function stringToPdfObject(
    str: string,
    index: number = 0,
    ignoreWhitespace: boolean = true,
): PdfObject {
    const bytes = stringToBytes(str)

    // Break it into chunks to test that the tokeniser can handle data in chunks
    const chunks: ByteArray[] = []
    const chunkSize = 10

    for (let i = 0; i < bytes.length; i += chunkSize) {
        chunks.push(bytes.slice(i, i + chunkSize))
    }

    const decoded: PdfObject[] = []
    const decoder = pdfDecoder(chunks, {
        ignoreWhitespace: ignoreWhitespace ?? true,
    })

    const removeWhitespace = (obj: PdfObject) => {
        obj.setModified(true)
        obj.preTokens = undefined
        obj.postTokens = undefined

        if (obj instanceof PdfStream) {
            obj.preStreamDataTokens = undefined
            obj.postStreamDataTokens = undefined
        }

        for (const key of Object.keys(obj)) {
            const value = (obj as any)[key]
            if (value instanceof Map) {
                for (const [key, mapValue] of value) {
                    if (key instanceof PdfName) {
                        removeWhitespace(key)
                    }
                    if (mapValue instanceof PdfObject) {
                        removeWhitespace(mapValue)
                    }
                }
            }
            if (value instanceof PdfObject) {
                removeWhitespace(value)
            } else if (Array.isArray(value)) {
                for (const item of value) {
                    if (item instanceof PdfObject) {
                        removeWhitespace(item)
                    }
                }
            }
        }
    }

    for (const object of decoder) {
        if (ignoreWhitespace) removeWhitespace(object)
        decoded.push(object)
    }

    decoded[index].setModified(true)
    return decoded[index]
}

describe('PDF decoder', () => {
    it('should decode a PDF dictionary', () => {
        expect(
            stringToPdfObject(
                '<</Linearized 1/L 71443/H[548 187]/O 36/E 2636/N 1/T 71078>>',
            ),
        ).toMatchObject(
            new PdfDictionary({
                Linearized: new PdfNumber(1),
                L: new PdfNumber(71443),
                H: new PdfArray([new PdfNumber(548), new PdfNumber(187)]),
                O: new PdfNumber(36),
                E: new PdfNumber(2636),
                N: new PdfNumber(1),
                T: new PdfNumber(71078),
            }),
        )
    })

    it('should decode nested PDF dictionaries', () => {
        expect(
            stringToPdfObject(
                '<</Type /Page/Parent 2 0 R/Resources<</Font<</F1 3 0 R>>>>/MediaBox[0 0 612 792]>>',
            ),
        ).toMatchObject(
            new PdfDictionary({
                Type: new PdfName('Page'),
                Parent: new PdfObjectReference(2, 0),
                Resources: new PdfDictionary({
                    Font: new PdfDictionary({
                        F1: new PdfObjectReference(3, 0),
                    }),
                }),
                MediaBox: new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(612),
                    new PdfNumber(792),
                ]),
            }),
        )
    })

    it('should decode PDF arrays', () => {
        expect(
            stringToPdfObject(
                '<< /Type /Page /MediaBox [0 0 612 792] /Contents 4 0 R >>',
            ),
        ).toMatchObject(
            new PdfDictionary({
                Type: new PdfName('Page'),
                MediaBox: new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(612),
                    new PdfNumber(792),
                ]),
                Contents: new PdfObjectReference(4, 0),
            }),
        )
    })

    it('should decode a blank PDF dictionary', () => {
        const pdfString = '<< /Test << >> >>'
        expect(stringToPdfObject(pdfString, 0, false).toString()).toEqual(
            pdfString,
        )
    })

    it('should decode PDF streams', () => {
        const stream = stringToPdfObject(
            '<< /Length 10 /Filter /FlateDecode >>stream\n...data...\nendstream',
        ).as(PdfStream)

        expect(stream.header).toMatchObject(
            new PdfDictionary({
                Length: new PdfNumber(11),
                Filter: new PdfName('FlateDecode'),
            }),
        )

        expect(stream.originalAsString).toBe('...data...\n')
    })

    it('should decode a PDF object stream', () => {
        const stream = stringToPdfObject(
            [
                '0 0 obj',
                '<</Length 1234 /Filter /FlateDecode>>stream',
                'data',
                'endstream',
                'endobj',
            ].join('\n'),
        )

        expect(stream).toMatchObject(
            new PdfIndirectObject({
                objectNumber: 0,
                generationNumber: 0,
                offset: 0,
                content: new PdfStream({
                    header: new PdfDictionary({
                        Length: new PdfNumber(1234),
                        Filter: new PdfName('FlateDecode'),
                    }),
                    original: stringToBytes('data\n'),
                }),
            }),
        )
    })

    it('should decode PDF hexadecimal strings', () => {
        expect(
            stringToPdfObject(
                '<</Value <FEFF00000000000000000000> /ID [<FEFF00000000000000000000><FEFF00000000000000000000>]>>',
            ),
        ).toEqual(
            new PdfDictionary({
                Value: new PdfHexadecimal('FEFF00000000000000000000', 'hex'),
                ID: new PdfArray([
                    new PdfHexadecimal('FEFF00000000000000000000', 'hex'),
                    new PdfHexadecimal('FEFF00000000000000000000', 'hex'),
                ]),
            }),
        )
    })

    it('should decode PDF strings', () => {
        expect(stringToPdfObject('<</Value (Hello, World!)>>')).toEqual(
            new PdfDictionary({
                Value: new PdfString('Hello, World!'),
            }),
        )
    })

    it('should decode PDF names', () => {
        expect(stringToPdfObject('<</Value /Name>>')).toEqual(
            new PdfDictionary({
                Value: new PdfName('Name'),
            }),
        )
    })

    it('should decode empty PDF arrays', () => {
        const pdfString = '<</Value [   ]>>'
        expect(stringToPdfObject(pdfString, 0, false).toString()).toEqual(
            pdfString,
        )
    })

    it('should ignore comments in objects but should preserve them in the output', () => {
        const input = '<<   /Value /Name % This is a comment>>'
        const object = stringToPdfObject(input, 0, false) as PdfDictionary

        expect(object.toString()).toBe(input)
        expect(
            object.toTokens().some((token) => token instanceof PdfCommentToken),
        ).toBe(true)
    })

    it('should handle nested structures', () => {
        expect(
            stringToPdfObject('<</Value << /Name /Nested >> /Array [1 2 3]>>'),
        ).toEqual(
            new PdfDictionary({
                Value: new PdfDictionary({
                    Name: new PdfName('Nested'),
                }),
                Array: new PdfArray([
                    new PdfNumber(1),
                    new PdfNumber(2),
                    new PdfNumber(3),
                ]),
            }),
        )
    })

    it('should identify objects', () => {
        expect(
            stringToPdfObject(
                ['3 1 obj', '<</Value /Name /Object 1 0 R>>', 'endobj'].join(
                    '\n',
                ),
            ),
        ).toEqual(
            new PdfIndirectObject({
                objectNumber: 3,
                generationNumber: 1,
                offset: 0,
                content: new PdfDictionary({
                    Value: new PdfName('Name'),
                    Object: new PdfObjectReference(1, 0),
                }),
            }),
        )
    })

    it('should decode XRef tables', () => {
        expect(
            stringToPdfObject(
                [
                    'xref',
                    '0 4',
                    '0000000000 65535 f',
                    '0000000010 00001 n',
                    '0000000050 00002 n',
                    '0000000100 00003 n',
                ].join('\n'),
            ),
        ).toEqual(
            new PdfXRefTable({
                sections: [
                    new PdfXRefTableSectionHeader({
                        startObjectNumber: 0,
                        entryCount: 4,
                    }),
                ],

                entries: [
                    new PdfXRefTableEntry({
                        objectNumber: 0,
                        generationNumber: 65535,
                        byteOffset: 0,
                        inUse: false,
                    }),
                    new PdfXRefTableEntry({
                        objectNumber: 1,
                        generationNumber: 1,
                        byteOffset: 10,
                        inUse: true,
                    }),
                    new PdfXRefTableEntry({
                        objectNumber: 2,
                        generationNumber: 2,
                        byteOffset: 50,
                        inUse: true,
                    }),
                    new PdfXRefTableEntry({
                        objectNumber: 3,
                        generationNumber: 3,
                        byteOffset: 100,
                        inUse: true,
                    }),
                ],
            }),
        )
    })

    it('should be able to identify PDF object references', () => {
        expect(stringToPdfObject('<</Value [3 0 R 4 0 R]>>')).toEqual(
            new PdfDictionary({
                Value: new PdfArray([
                    new PdfObjectReference(3, 0),
                    new PdfObjectReference(4, 0),
                ]),
            }),
        )
    })

    it('should decode a comment', () => {
        const pdfString = '  This is a comment'
        const object = stringToPdfObject(`  %${pdfString}`, 0, false)
        const expected = new PdfComment(pdfString)
        expected.postTokens = []
        expected.preTokens = [
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
        ]
        expect(object).toEqual(expected)
    })

    it('should decode a trailer', () => {
        const expected = new PdfTrailer({
            Size: new PdfNumber(5),
            Root: new PdfObjectReference(1, 0),
            Info: new PdfObjectReference(2, 0),
        })
        expect(
            stringToPdfObject(
                ['trailer', '<</Size 5 /Root 1 0 R /Info 2 0 R>>'].join('\n'),
            ),
        ).toEqual(expected)
    })

    it('should decode a startxref', () => {
        expect(stringToPdfObject('startxref\n1234')).toEqual(
            new PdfStartXRef(1234),
        )
    })

    it('should decode an object inside an array', () => {
        const pdfString = `
<<
  /Type /Sig
  /Filter /Adobe.PPKLite
  /SubFilter /adbe.pkcs7.detached
  /Reference [<<
      /Type /SigRef
      /TransformMethod /UR3
      /TransformParams <<
        /Type /TransformParams
        /V 2.2
        /Document [ /FullSave ]
        /Annots [ /Create /Delete /Modify ]
      >>
    >>]
>>   
`

        const object = stringToPdfObject(pdfString, 0, false)
        expect(object.toString()).toBe(pdfString)
        expect(object).toMatchInlineSnapshot(`
          PdfDictionary {
            "innerTokens": [
              PdfWhitespaceToken {
                "rawBytes": Uint8Array [
                  10,
                ],
              },
              PdfWhitespaceToken {
                "rawBytes": Uint8Array [
                  32,
                ],
              },
              PdfWhitespaceToken {
                "rawBytes": Uint8Array [
                  32,
                ],
              },
            ],
            "modified": true,
            "postTokens": [
              PdfWhitespaceToken {
                "rawBytes": Uint8Array [
                  32,
                ],
              },
              PdfWhitespaceToken {
                "rawBytes": Uint8Array [
                  32,
                ],
              },
              PdfWhitespaceToken {
                "rawBytes": Uint8Array [
                  32,
                ],
              },
              PdfWhitespaceToken {
                "rawBytes": Uint8Array [
                  10,
                ],
              },
            ],
            "preTokens": [
              PdfWhitespaceToken {
                "rawBytes": Uint8Array [
                  10,
                ],
              },
            ],
          }
        `)
    })

    it('should handle object references inside an object', () => {
        const pdfString = ['51 0 obj', '[52 0 R]', 'endobj'].join('\n')

        const object = stringToPdfObject(pdfString)
        expect(object).toEqual(
            new PdfIndirectObject({
                objectNumber: 51,
                generationNumber: 0,
                offset: 0,
                content: new PdfArray([new PdfObjectReference(52, 0)]),
            }),
        )
    })

    it('should handle numbers inside an object', () => {
        const pdfString = ['51 0 obj', '123', 'endobj'].join('\n')

        const object = stringToPdfObject(pdfString)
        expect(object).toEqual(
            new PdfIndirectObject({
                objectNumber: 51,
                generationNumber: 0,
                offset: 0,
                content: new PdfNumber({
                    value: 123,
                    padTo: 3,
                }),
            }),
        )
    })

    it('should decode a basic PDF', () => {
        const content = [
            '%PDF-2.0',
            '1 0 obj',
            '<< /Type /Catalog /Pages 2 0 R >>',
            'endobj',
            '2 0 obj',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            'endobj',
            '3 0 obj',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            'endobj',
            '4 0 obj',
            '<< /Length 44 >>',
            'stream',
            `BT /F1 12 Tf 1 0 0 1 220 700 Tm (Hello, World!) Tj ET`,
            'endstream',
            'endobj',
            '5 0 obj',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            'endobj',
            'xref',
            '0 6',
            '0000000000 65535 f',
            '0000000010 00000 n',
            '0000000060 00000 n',
            '0000000110 00000 n',
            '0000000170 00000 n',
            '0000000344 00000 n',
            '10 5',
            '0000000591 00000 n',
            '0000000591 00000 n',
            '0000000591 00000 n',
            '0000000591 00000 n',
            '0000000591 00000 n',
            'trailer',
            '<< /Size 5 /Root 1 0 R >>',
            'startxref',
            '414',
            '%%EOF',
            '5 0 obj',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Override true /Length 11 >>stream',
            'streamdata',
            'endstream',
            'endobj',
            'xref',
            '5 1',
            '0000000591 00000 n',
            'trailer',
            '<< /Size 5 /Root 1 0 R /Prev 414 >>',
            'startxref',
            '703',
            '%%EOF',
            '',
        ].join('\n')

        const pdfBuffer = stringToBytes(content)
        const decoder = pdfDecoder([pdfBuffer])

        const output: PdfObject[] = []

        for (const object of decoder) {
            output.push(object)
        }

        const outputString = output.map((obj) => obj.toString()).join('')
        expect(output.map((x) => x.objectType).join('\n'))
            .toMatchInlineSnapshot(`
          "PdfComment
          PdfIndirectObject
          PdfIndirectObject
          PdfIndirectObject
          PdfIndirectObject
          PdfIndirectObject
          PdfXRefTable
          PdfTrailer
          PdfStartXRef
          PdfComment
          PdfIndirectObject
          PdfXRefTable
          PdfTrailer
          PdfStartXRef
          PdfComment"
        `)
        expect(outputString).toBe(content)
    })
})
