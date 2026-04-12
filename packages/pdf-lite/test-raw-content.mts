import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const buffer = await readFile('./test/unit/fixtures/multi-child-field.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])

const page = doc.pages.toArray()[0]
const stream = page.contentStreams[0]

// Get first 500 chars of decompressed content
const raw = stream.dataAsString
console.log('=== RAW CONTENT (first 500 chars) ===')
console.log(raw.substring(0, 500))
console.log('\n=== LOOKING FOR Tj OPERATIONS ===')
// Find all Tj ops
const tjRegex = /\([^)]*\)\s*Tj/g
let match
let i = 0
while ((match = tjRegex.exec(raw)) !== null && i < 5) {
    console.log(`Match ${i}: ${match[0]}`)
    i++
}

console.log('\n=== LOOKING FOR TJ OPERATIONS ===')
const tjArrRegex = /\[[^\]]*\]\s*TJ/g
let m
let j = 0
while ((m = tjArrRegex.exec(raw)) !== null && j < 3) {
    console.log(`Match ${j}: ${m[0].substring(0, 150)}`)
    j++
}
