import { PdfDocument } from '../packages/pdf-lite/src/index.js'
import { PdfXfaForm } from '../packages/pdf-lite/src/acroform/xfa/pdf-xfa-form.js'
import fs from 'fs'

const doc = await PdfDocument.fromBytes([fs.readFileSync('./output.pdf')])
const xfa = await PdfXfaForm.fromDocument(doc)
if (!xfa) {
    console.log('NO XFA FORM FOUND')
    process.exit(1)
}
if (!xfa.datasets) {
    console.log('XFA FORM FOUND but datasets is NULL')
    process.exit(1)
}
const xml = xfa.datasets.readXml()
console.log('XML length:', xml.length)
console.log('First 2000 chars:\n', xml.slice(0, 2000))
