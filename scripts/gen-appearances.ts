import { PdfDocument } from '../packages/pdf-lite/src'
import * as fs from 'fs'

const pdf =
    '/Users/jakeshirley/Documents/GitHub/svat-api/products/templates/src/vlegacy/templates/27/IT - ANR form_to client.pdf'

const pdfDoc = await PdfDocument.fromBytes([fs.readFileSync(pdf)])

const acroform = await pdfDoc.acroForm.read()
if (!acroform) {
    throw new Error('missing acroform')
}

await pdfDoc.acroForm.write(acroform)

console.log(await pdfDoc.acroForm.read().then((a) => a?.exportData()))

fs.writeFileSync('./output.pdf', pdfDoc.toBytes())
