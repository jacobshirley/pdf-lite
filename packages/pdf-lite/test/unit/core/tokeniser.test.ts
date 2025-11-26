import { describe, expect, it } from 'vitest'
import { PdfByteStreamTokeniser } from '../../../src/core/tokeniser.js'
import { PdfToken } from '../../../src/core/tokens/token.js'
import { PdfCommentToken } from '../../../src/core/tokens/comment-token.js'
import { PdfWhitespaceToken } from '../../../src/core/tokens/whitespace-token.js'
import { PdfStartDictionaryToken } from '../../../src/core/tokens/start-dictionary-token.js'
import { PdfNameToken } from '../../../src/core/tokens/name-token.js'
import { PdfEndDictionaryToken } from '../../../src/core/tokens/end-dictionary-token.js'
import { PdfHexadecimalToken } from '../../../src/core/tokens/hexadecimal-token.js'
import { PdfObjectReferenceToken } from '../../../src/core/tokens/object-reference-token.js'
import { PdfStartArrayToken } from '../../../src/core/tokens/start-array-token.js'
import { PdfNumberToken } from '../../../src/core/tokens/number-token.js'
import { PdfEndArrayToken } from '../../../src/core/tokens/end-array-token.js'
import { PdfStringToken } from '../../../src/core/tokens/string-token.js'
import { PdfStartObjectToken } from '../../../src/core/tokens/start-object-token.js'
import { PdfEndObjectToken } from '../../../src/core/tokens/end-object-token.js'
import { PdfBooleanToken } from '../../../src/core/tokens/boolean-token.js'
import { PdfNullToken } from '../../../src/core/tokens/null-token.js'
import { PdfStartStreamToken } from '../../../src/core/tokens/start-stream-token.js'
import { PdfStreamChunkToken } from '../../../src/core/tokens/stream-chunk-token.js'
import { PdfEndStreamToken } from '../../../src/core/tokens/end-stream-token.js'
import { PdfStartXRefToken } from '../../../src/core/tokens/start-xref-token.js'
import { PdfTrailerToken } from '../../../src/core/tokens/trailer-token.js'
import { PdfXRefTableStartToken } from '../../../src/core/tokens/xref-table-start-token.js'
import { PdfXRefTableSectionStartToken } from '../../../src/core/tokens/xref-table-section-start-token.js'
import { PdfXRefTableEntryToken } from '../../../src/core/tokens/xref-table-entry-token.js'
import { concatUint8Arrays } from '../../../src/utils/concatUint8Arrays.js'
import { bytesToString } from '../../../src/utils/bytesToString.js'
import { stringToBytes } from '../../../src/utils/stringToBytes.js'
import { ByteArray } from '../../../src/types.js'

function stringToPdfTokens(str: string | ByteArray): PdfToken[] {
    const reader = new PdfByteStreamTokeniser()
    const tokens: PdfToken[] = []

    const bytes = str instanceof Uint8Array ? str : stringToBytes(str)

    // Break it into chunks to test that the tokeniser can handle data in chunks
    const chunks: ByteArray[] = []
    const chunkSize = 10

    for (let i = 0; i < bytes.length; i += chunkSize) {
        chunks.push(bytes.slice(i, i + chunkSize))
    }

    for (const chunk of chunks) {
        reader.feedBytes(chunk)

        for (const token of reader.nextItems()) {
            tokens.push(token)
        }
    }

    reader.eof = true

    for (const token of reader.nextItems()) {
        tokens.push(token)
    }

    return tokens
}

describe('PDF tokeniser', () => {
    it('should tokenise a PDF comment', () => {
        const pdfString = '% This is a comment\n  % This is another comment'
        const tokens = stringToPdfTokens(pdfString)

        expect(tokens).toEqual([
            new PdfCommentToken(' This is a comment'),
            PdfWhitespaceToken.NEWLINE,
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            new PdfCommentToken(' This is another comment'),
        ])
    })

    it('should tokenise comments between other tokens', () => {
        const pdfString = '<</Value /Name  % This is a comment>>'
        const expectedTokens = [
            new PdfStartDictionaryToken(),
            new PdfNameToken('Value'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Name'),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            new PdfCommentToken(' This is a comment'),
            new PdfEndDictionaryToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should tokenise a PDF dictionary', () => {
        const pdfString =
            '<< /Type /Page /Id <deadbeef> /Parent 1 0 R /MediaBox[ 0 0 612 792 ] >>'
        const expectedTokens = [
            new PdfStartDictionaryToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Page'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Id'),
            PdfWhitespaceToken.SPACE,
            new PdfHexadecimalToken('deadbeef'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Parent'),
            PdfWhitespaceToken.SPACE,
            new PdfObjectReferenceToken(1, 0),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('MediaBox'),
            new PdfStartArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(612),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(792),
            PdfWhitespaceToken.SPACE,
            new PdfEndArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfEndDictionaryToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should tokenise nested dictionaries', () => {
        const pdfString = '<</Sub << /Type /Page /Parent 1 0 R >> >>'
        const expectedTokens = [
            new PdfStartDictionaryToken(),
            new PdfNameToken('Sub'),
            PdfWhitespaceToken.SPACE,
            new PdfStartDictionaryToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Page'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Parent'),
            PdfWhitespaceToken.SPACE,
            new PdfObjectReferenceToken(1, 0),
            PdfWhitespaceToken.SPACE,
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.SPACE,
            new PdfEndDictionaryToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle nested arrays', () => {
        const pdfString = '<< /Type /Page /MediaBox [ 0 0 [ 612 792   ] ]  >>'
        const expectedTokens = [
            new PdfStartDictionaryToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Page'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('MediaBox'),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(612),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(792),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            new PdfEndArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfEndArrayToken(),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            new PdfEndDictionaryToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle hex strings', () => {
        const pdfString = '<deadbeef>'
        const expectedToken = new PdfHexadecimalToken('deadbeef')

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual([expectedToken])
    })

    it('should handle object references', () => {
        const pdfString = '1 0 R'
        const expectedToken = new PdfObjectReferenceToken(1, 0)

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual([expectedToken])
    })

    it('should handle strings', () => {
        const pdfString = '<</Type (Hello, World!)/Something/Test>>'
        const expectedTokens = [
            new PdfStartDictionaryToken(),
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfStringToken('Hello, World!'),
            new PdfNameToken('Something'),
            new PdfNameToken('Test'),
            new PdfEndDictionaryToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle numbers', () => {
        const pdfString = ' 123.456 '
        const expectedTokens = [
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(123.456, 0, 3),
            PdfWhitespaceToken.SPACE,
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle objects', () => {
        const pdfString = [
            '0 0 obj',
            '<<',
            '/Type /Page',
            '/MediaBox [ 0 0 612 792 ]',
            '>>',
            'endobj',
        ].join('\n')

        const expectedTokens = [
            new PdfStartObjectToken(0, 0, 0),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Page'),
            PdfWhitespaceToken.NEWLINE,
            new PdfNameToken('MediaBox'),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(612),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(792),
            PdfWhitespaceToken.SPACE,
            new PdfEndArrayToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle objects 2', () => {
        const pdfString = `\n30 0 obj
<</Linearized 1/L 71443/H[548 187]/O 36/E 2636/N 1/T  71078>>
endobj`

        const expectedTokens = [
            PdfWhitespaceToken.NEWLINE,
            new PdfStartObjectToken(30, 0, 1),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            new PdfNameToken('Linearized'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(1),
            new PdfNameToken('L'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(71443),
            new PdfNameToken('H'),
            new PdfStartArrayToken(),
            new PdfNumberToken(548),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(187),
            new PdfEndArrayToken(),
            new PdfNameToken('O'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(36),
            new PdfNameToken('E'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(2636),
            new PdfNameToken('N'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(1),
            new PdfNameToken('T'),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(71078),
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle objects 3', () => {
        const pdfString = `<</Length    49 /Type /XRef /Size 41 /Filter /FlateDecode /Index [30 11] /Encrypt 32 0 R /Root 33 0 R /Info 16 0 R /ID [<F68F2B76D21DB2110A00000000000000><3F5AB404D0A3432E838AB405E7DD80F9>] /Prev 71079 /W [1 2 1] /DecodeParms <</Columns 4/Predictor 12>>>>`

        const expectedTokens = [
            new PdfStartDictionaryToken(),
            new PdfNameToken('Length'),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(49),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('XRef'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Size'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(41),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Filter'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('FlateDecode'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Index'),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            new PdfNumberToken(30),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(11),
            new PdfEndArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Encrypt'),
            PdfWhitespaceToken.SPACE,
            new PdfObjectReferenceToken(32, 0),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Root'),
            PdfWhitespaceToken.SPACE,
            new PdfObjectReferenceToken(33, 0),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Info'),
            PdfWhitespaceToken.SPACE,
            new PdfObjectReferenceToken(16, 0),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('ID'),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            new PdfHexadecimalToken('F68F2B76D21DB2110A00000000000000'),
            new PdfHexadecimalToken('3F5AB404D0A3432E838AB405E7DD80F9'),
            new PdfEndArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Prev'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(71079),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('W'),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            new PdfNumberToken(1),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(2),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(1),
            new PdfEndArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('DecodeParms'),
            PdfWhitespaceToken.SPACE,
            new PdfStartDictionaryToken(),
            new PdfNameToken('Columns'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(4),
            new PdfNameToken('Predictor'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(12),
            new PdfEndDictionaryToken(),
            new PdfEndDictionaryToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle objects 4', () => {
        const pdfString = `32 0 obj
<</StrF/StdCF/O(123)/Filter/Standard/R 4/CF<</StdCF<</Type/CryptFilter/Length 16/CFM/AESV2/EncryptMetadata false>>>>/U(456)/EncryptMetadata false/Length 128/StmF/StdCF/P -532/V 4>>
endobj`

        const expectedTokens = [
            new PdfStartObjectToken(32, 0, 0),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            new PdfNameToken('StrF'),
            new PdfNameToken('StdCF'),
            new PdfNameToken('O'),
            new PdfStringToken('123'),
            new PdfNameToken('Filter'),
            new PdfNameToken('Standard'),
            new PdfNameToken('R'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(4),
            new PdfNameToken('CF'),
            new PdfStartDictionaryToken(),
            new PdfNameToken('StdCF'),
            new PdfStartDictionaryToken(),
            new PdfNameToken('Type'),
            new PdfNameToken('CryptFilter'),
            new PdfNameToken('Length'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(16),
            new PdfNameToken('CFM'),
            new PdfNameToken('AESV2'),
            new PdfNameToken('EncryptMetadata'),
            PdfWhitespaceToken.SPACE,
            new PdfBooleanToken(false),
            new PdfEndDictionaryToken(),
            new PdfEndDictionaryToken(),
            new PdfNameToken('U'),
            new PdfStringToken('456'),
            new PdfNameToken('EncryptMetadata'),
            PdfWhitespaceToken.SPACE,
            new PdfBooleanToken(false),
            new PdfNameToken('Length'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(128),
            new PdfNameToken('StmF'),
            new PdfNameToken('StdCF'),
            new PdfNameToken('P'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(-532),
            new PdfNameToken('V'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(4),
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle objects 5', () => {
        const pdfString = `3 0 obj
<</D[18 0 R/XYZ 0 792 null]/S/GoTo>>
endobj`

        const expectedTokens = [
            new PdfStartObjectToken(3, 0, 0),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            new PdfNameToken('D'),
            new PdfStartArrayToken(),
            new PdfObjectReferenceToken(18, 0),
            new PdfNameToken('XYZ'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(792),
            PdfWhitespaceToken.SPACE,
            new PdfNullToken(),
            new PdfEndArrayToken(),
            new PdfNameToken('S'),
            new PdfNameToken('GoTo'),
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle booleans', () => {
        const pdfString = '<</Contents true/Another false >>'
        const expectedTokens = [
            new PdfStartDictionaryToken(),
            new PdfNameToken('Contents'),
            PdfWhitespaceToken.SPACE,
            new PdfBooleanToken(true),
            new PdfNameToken('Another'),
            PdfWhitespaceToken.SPACE,
            new PdfBooleanToken(false),
            PdfWhitespaceToken.SPACE,
            new PdfEndDictionaryToken(),
        ]
        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle null', () => {
        const pdfString = '<</Contents null /Another /null>>'
        const expectedTokens = [
            new PdfStartDictionaryToken(),
            new PdfNameToken('Contents'),
            PdfWhitespaceToken.SPACE,
            new PdfNullToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Another'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('null'),
            new PdfEndDictionaryToken(),
        ]
        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle streams', () => {
        const pdfString = [
            '',
            '',
            '0 0 obj',
            '<<',
            '/Type /Page',
            '/MediaBox [ 0 0 612 792 ]',
            '>> ',
            ' stream',
            'Hello, World!',
            'endstream',
            'endobj',
        ].join('\n')

        const expectedTokens = [
            PdfWhitespaceToken.NEWLINE,
            PdfWhitespaceToken.NEWLINE,
            new PdfStartObjectToken(0, 0, 2),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Page'),
            PdfWhitespaceToken.NEWLINE,
            new PdfNameToken('MediaBox'),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(612),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(792),
            PdfWhitespaceToken.SPACE,
            new PdfEndArrayToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            PdfWhitespaceToken.SPACE,
            new PdfStartStreamToken(stringToBytes('stream\n')),
            new PdfStreamChunkToken(stringToBytes('Hello, World!\n')),
            new PdfEndStreamToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle streams on the same line as endstream', () => {
        const pdfString = [
            '0 0 obj',
            '<<',
            '/Type /Page',
            '/MediaBox [ 0 0 612 792 ]',
            '>>',
            'stream',
            'Hello, World!endstream',
            'endobj',
        ].join('\n')

        expect(stringToPdfTokens(pdfString)).toEqual([
            new PdfStartObjectToken(0, 0, 0),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Page'),
            PdfWhitespaceToken.NEWLINE,
            new PdfNameToken('MediaBox'),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(612),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(792),
            PdfWhitespaceToken.SPACE,
            new PdfEndArrayToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartStreamToken(stringToBytes('stream\n')),
            new PdfStreamChunkToken(stringToBytes('Hello, World!')),
            new PdfEndStreamToken(stringToBytes('endstream')),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ])
    })

    it('should allow endstream to not be on a new line', () => {
        const pdfString = [
            '0 0 obj',
            '<<',
            '/Type /Page',
            '/MediaBox [ 0 0 612 792 ]',
            '>>',
            'stream',
            'Hello, World!',
            'endstream',
            'endobj',
        ].join('\n')

        const expectedTokens = [
            new PdfStartObjectToken(0, 0, 0),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfNameToken('Type'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Page'),
            PdfWhitespaceToken.NEWLINE,
            new PdfNameToken('MediaBox'),
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(612),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(792),
            PdfWhitespaceToken.SPACE,
            new PdfEndArrayToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartStreamToken(stringToBytes('stream\n')),
            new PdfStreamChunkToken(stringToBytes('Hello, World!\n')),
            new PdfEndStreamToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle a multi-line object', () => {
        const str = `37 0 obj
<</Filter /FlateDecode /Length    528>>stream
test
test
test
endstream
endobj`

        const expectedTokens = [
            new PdfStartObjectToken(37, 0, 0),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            new PdfNameToken('Filter'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('FlateDecode'),
            PdfWhitespaceToken.SPACE,
            new PdfNameToken('Length'),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(528),
            new PdfEndDictionaryToken(),
            new PdfStartStreamToken(stringToBytes('stream\n')),
            new PdfStreamChunkToken(stringToBytes('test\ntest\ntest\n')),
            new PdfEndStreamToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]

        const tokens = stringToPdfTokens(str)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle object references as the second array element', () => {
        const pdfString = `49 0 obj
<</Nums[0 51 0 2 4 R]>>
endobj`

        const expectedTokens = [
            new PdfStartObjectToken(49, 0, 0),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            new PdfNameToken('Nums'),
            new PdfStartArrayToken(),
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(51),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(0),
            PdfWhitespaceToken.SPACE,
            new PdfObjectReferenceToken(2, 4),
            new PdfEndArrayToken(),
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle a startxref', () => {
        const pdfString = ['startxref ', '123456'].join('\n')

        const expectedTokens = [
            new PdfStartXRefToken(),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfNumberToken(123456),
        ]
        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle a trailer', () => {
        const pdfString = [
            'trailer  ',
            '<</Size 50/Root 1 0 R>>',
            'startxref',
            '123456',
            '%%EOF',
        ].join('\n')

        const expectedTokens = [
            new PdfTrailerToken(0),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            new PdfNameToken('Size'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(50),
            new PdfNameToken('Root'),
            PdfWhitespaceToken.SPACE,
            new PdfObjectReferenceToken(1, 0),
            new PdfEndDictionaryToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartXRefToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfNumberToken(123456),
            PdfWhitespaceToken.NEWLINE,
            new PdfCommentToken('%EOF'),
        ]
        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle xref tables', () => {
        const pdfString = [
            'xref ',
            '0 3 ',
            '0000000000 65535 f ',
            '0000000010 00005 n ',
            '0000001000 00020 f ',
            'trailer',
        ].join('\n')

        const expectedTokens = [
            new PdfXRefTableStartToken(0),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableSectionStartToken(0, 3),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableEntryToken(
                new PdfNumberToken(stringToBytes('0000000000')),
                new PdfNumberToken(stringToBytes('65535')),
                0,
                false,
            ),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableEntryToken(
                new PdfNumberToken(stringToBytes('0000000010')),
                new PdfNumberToken(stringToBytes('00005')),
                1,
                true,
            ),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableEntryToken(
                new PdfNumberToken(stringToBytes('0000001000')),
                new PdfNumberToken(stringToBytes('00020')),
                2,
                false,
            ),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfTrailerToken(102),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle xref tables with object references', () => {
        const pdfString = [
            'xref ',
            '0 1',
            '0000000000 65535 f',
            '8 1',
            '0000005897 00000 n',
            '22 1 ',
            '0000009571 00000 n',
            'trailer',
            '<</Size 50/Root 1 0 R>>',
        ].join('\n')

        const expectedTokens = [
            new PdfXRefTableStartToken(0),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableSectionStartToken(0, 1),
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableEntryToken(
                new PdfNumberToken(stringToBytes('0000000000')),
                65535,
                0,
                false,
            ),
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableSectionStartToken(8, 1),
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableEntryToken(
                new PdfNumberToken(stringToBytes('0000005897')),
                new PdfNumberToken(stringToBytes('00000')),
                8,
                true,
            ),
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableSectionStartToken(22, 1),
            PdfWhitespaceToken.SPACE,
            PdfWhitespaceToken.NEWLINE,
            new PdfXRefTableEntryToken(
                new PdfNumberToken(stringToBytes('0000009571')),
                new PdfNumberToken(stringToBytes('00000')),
                22,
                true,
            ),
            PdfWhitespaceToken.NEWLINE,
            new PdfTrailerToken(129),
            PdfWhitespaceToken.NEWLINE,
            new PdfStartDictionaryToken(),
            new PdfNameToken('Size'),
            PdfWhitespaceToken.SPACE,
            new PdfNumberToken(50),
            new PdfNameToken('Root'),
            PdfWhitespaceToken.SPACE,
            new PdfObjectReferenceToken(1, 0),
            new PdfEndDictionaryToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle escape sequences in strings', () => {
        const leftParmethesis = 0x28
        const rightParmethesis = 0x29
        const bashslash = 0x5c
        const pdfString = new Uint8Array([
            leftParmethesis,
            bashslash,
            bashslash,
            rightParmethesis,
        ])

        const expectedTokens = [new PdfStringToken(stringToBytes('\\'))]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should escape octal sequences in strings', () => {
        const pdfString = new Uint8Array([0x28, 0x5c, 0x31, 0x30, 0x31, 0x29])

        const expectedTokens = [new PdfStringToken(new Uint8Array([0x41]))]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should escape line feed in strings', () => {
        const pdfString = new Uint8Array([0x28, 0x5c, 0x6e, 0x29])

        const expectedTokens = [new PdfStringToken(new Uint8Array([0x0a]))]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle nested strings', () => {
        const pdfString = '((Hello, World!))'

        const expectedTokens = [
            new PdfStringToken(stringToBytes('(Hello, World!)')),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle nested strings', () => {
        const pdfString = '((Hello, World!))'

        const expectedTokens = [
            new PdfStringToken(stringToBytes('(Hello, World!)')),
        ]
        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should treat a backslash followed by a line feed as a line continuation', () => {
        const pdfString = '(Hello\\\nWorld)'

        const expectedTokens = [new PdfStringToken(stringToBytes('HelloWorld'))]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle objects across multiple lines', () => {
        const pdfString = `
        trailer
        <<  
  /Root -1 -1 R
/Size 1
>>`

        const tokens = stringToPdfTokens(pdfString)
        const byteCount = tokens.reduce(
            (sum, token) => sum + token.byteLength,
            0,
        )
        expect(tokens.map((x) => x.toString()).join('')).toBe(pdfString)
        expect(byteCount).toBe(pdfString.length)
        expect(tokens).toMatchInlineSnapshot(`
          [
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
            PdfTrailerToken {
              "byteOffset": 10,
              "rawBytes": Uint8Array [
                116,
                114,
                97,
                105,
                108,
                101,
                114,
              ],
            },
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
            PdfStartDictionaryToken {
              "rawBytes": Uint8Array [
                60,
                60,
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
            PdfNameToken {
              "name": "Root",
              "rawBytes": Uint8Array [
                47,
                82,
                111,
                111,
                116,
              ],
            },
            PdfWhitespaceToken {
              "rawBytes": Uint8Array [
                32,
              ],
            },
            PdfObjectReferenceToken {
              "generationNumber": -1,
              "objectNumber": -1,
              "rawBytes": Uint8Array [
                45,
                49,
                32,
                45,
                49,
                32,
                82,
              ],
            },
            PdfWhitespaceToken {
              "rawBytes": Uint8Array [
                10,
              ],
            },
            PdfNameToken {
              "name": "Size",
              "rawBytes": Uint8Array [
                47,
                83,
                105,
                122,
                101,
              ],
            },
            PdfWhitespaceToken {
              "rawBytes": Uint8Array [
                32,
              ],
            },
            PdfNumberToken {
              "decimalPlaces": 0,
              "isByteToken": false,
              "padTo": 0,
              "rawBytes": Uint8Array [],
            },
            PdfWhitespaceToken {
              "rawBytes": Uint8Array [
                10,
              ],
            },
            PdfEndDictionaryToken {
              "rawBytes": Uint8Array [
                62,
                62,
              ],
            },
          ]
        `)
    })

    it('should handle an array of names', () => {
        const pdfString = '/Annots[/Create/Delete/Modify]'

        const expectedTokens = [
            new PdfNameToken('Annots'),
            new PdfStartArrayToken(),
            new PdfNameToken('Create'),
            new PdfNameToken('Delete'),
            new PdfNameToken('Modify'),
            new PdfEndArrayToken(),
        ]

        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })

    it('should handle object references inside an object', () => {
        const pdfString = ['51 0 obj', ' [52 0 R]', 'endobj'].join('\n')

        const expectedTokens = [
            new PdfStartObjectToken(51, 0, 0),
            PdfWhitespaceToken.NEWLINE,
            PdfWhitespaceToken.SPACE,
            new PdfStartArrayToken(),
            new PdfObjectReferenceToken(52, 0),
            new PdfEndArrayToken(),
            PdfWhitespaceToken.NEWLINE,
            new PdfEndObjectToken(),
        ]
        const tokens = stringToPdfTokens(pdfString)
        expect(tokens).toEqual(expectedTokens)
    })
})
