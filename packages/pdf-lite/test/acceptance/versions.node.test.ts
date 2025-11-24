import { describe, expect, test } from 'vitest'
import fs from 'fs'
import { PdfDocument } from '../../src/pdf/pdf-document.js'

async function readPdf(fileName: string): Promise<PdfDocument> {
    const data = fs.readFileSync(`${import.meta.dirname}/fixtures/${fileName}`)

    return PdfDocument.fromBytes([data])
}

const fixtures = {
    '1.3': ['basic.pdf'],
    '1.4': [
        'basic.pdf',
        'basic-rc4-40.pdf',
        'basic-rc4-128.pdf',
        'basic-aes-128.pdf',
        'basic-aes-256.pdf',
    ],
    '1.5': ['basic.pdf'],
    '1.6': ['basic.pdf'],
    '1.7': ['basic.pdf'],
    '2.0': [
        'basic.pdf',
        'basic-rc4-40.pdf',
        'basic-rc4-128.pdf',
        'basic-aes-128.pdf',
        'basic-aes-256.pdf',
    ],
}

for (const version in fixtures) {
    describe(`PDF ${version} acceptance tests`, () => {
        for (const fileName of fixtures[version as keyof typeof fixtures]) {
            test(`${version}-${fileName}`, { timeout: 20000 }, async () => {
                const objects = await readPdf(`${version}/${fileName}`)
                expect(objects).toMatchSnapshot()
            })
        }
    })
}
