import { PdfDocument } from '../packages/pdf-lite/src'
import * as fs from 'fs'

const pdf =
    '/Users/jakeshirley/Documents/GitHub/svat-api/products/templates/src/vlegacy/templates/205/Allegato_1.pdf'

const pdfDoc = await PdfDocument.fromBytes([fs.readFileSync(pdf)])

const acroform = pdfDoc.acroform
if (!acroform) {
    throw new Error('missing acroform')
}

const fields = acroform.fields

console.log(
    fields
        .map((f) => f.name + ': ' + f.value)
        .sort()
        .join('\n'),
)

fs.writeFileSync('./output.pdf', pdfDoc.toBytes())
