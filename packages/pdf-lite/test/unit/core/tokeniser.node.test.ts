import { describe, expect, it } from 'vitest'
import { PdfByteStreamTokeniser } from '../../../src/core/tokeniser.js'
import { PdfToken } from '../../../src/core/tokens/token.js'
import { bytesToString } from '../../../src/utils/bytesToString.js'
import fs from 'fs'
import { concatUint8Arrays } from '../../../src/utils/concatUint8Arrays.js'

describe('PDF tokeniser', () => {
    it('should read and write a file, ensuring it is byte-for-byte the same', () => {
        const pdfBuffer = fs.readFileSync(
            __dirname + '/../fixtures/protectedAdobeLivecycle.pdf',
        )

        const tokeniser = new PdfByteStreamTokeniser({
            streamChunkSizeBytes: 500 * 1000, // 500 KB
        })
        const output: PdfToken[] = []

        for (const byte of new Uint8Array(pdfBuffer)) {
            tokeniser.feed(byte)
        }
        tokeniser.eof = true

        for (const token of tokeniser.nextItems()) {
            output.push(token)
        }

        expect(output.length).toEqual(4042)
        expect(output).toMatchSnapshot()

        const outputBytes = concatUint8Arrays(
            ...output.map((token) => token.toBytes()),
        )
        const pdfStr = pdfBuffer.toString()
        const outputStr = bytesToString(outputBytes)
        expect(outputStr).toEqual(pdfStr)
    })
})
