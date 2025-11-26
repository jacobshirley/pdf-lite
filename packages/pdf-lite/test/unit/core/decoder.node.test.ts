import { describe, expect, it } from 'vitest'
import { pdfDecoder } from '../../../src/core/generators.js'
import { PdfObject } from '../../../src/core/objects/pdf-object.js'
import { readFileSync } from 'fs'

describe('PDF decoder', () => {
    it('should read and write a file, ensuring it is byte-for-byte the same', async () => {
        const pdfBuffer = readFileSync(
            './test/unit/fixtures/protectedAdobeLivecycle.pdf',
        )
        const output: PdfObject[] = []

        for (const obj of pdfDecoder([pdfBuffer])) {
            output.push(obj)
        }

        const outputString = output.map((obj) => obj.toString()).join('')
        expect(outputString).toBe(pdfBuffer.toString('latin1'))
        expect(output).toMatchSnapshot()
    })
})
