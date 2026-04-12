import { PdfDocument } from './src/pdf/pdf-document.js'
import { readFile } from 'fs/promises'

const buffer = await readFile('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
const page = doc.pages.get(0)
const cs = page.contentStreams[0]
const raw = cs.dataAsString!

// Find all q/Q/BT/ET/Tf operations with line numbers
const lines = raw.split('\n')
let qDepth = 0
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === 'q') {
        console.log(`${i}: ${'  '.repeat(qDepth)}q (save) depth=${qDepth}→${qDepth+1}`)
        qDepth++
    } else if (line === 'Q') {
        qDepth--
        console.log(`${i}: ${'  '.repeat(qDepth)}Q (restore) depth=${qDepth+1}→${qDepth}`)
    } else if (line === 'BT') {
        console.log(`${i}: ${'  '.repeat(qDepth)}BT`)
    } else if (line === 'ET') {
        console.log(`${i}: ${'  '.repeat(qDepth)}ET`)
    } else if (line.endsWith('Tf')) {
        console.log(`${i}: ${'  '.repeat(qDepth)}${line}`)
    }
    if (i > 70) break
}
