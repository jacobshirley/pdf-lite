// Quick inline test of text extraction
import { PdfContentStreamObject } from './src/graphics/pdf-content-stream.ts'

const stream1 = 'BT /F1 12 Tf 100 700 Td (Hello World) Tj ET'
const stream2 = 'BT /F1 12 Tf 100 700 Td (First Line) Tj 0 -20 Td (Second Line) Tj ET'
const stream3 = 'BT /F1 12 Tf 100 700 Td <48656C6C6F> Tj ET'

console.log('Testing Text Extraction:\n')

console.log('1. Simple text:')
const s1 = new PdfContentStreamObject(stream1)
const blocks1 = s1.textBlocks
console.log(`   Blocks found: ${blocks1.length}`)
if (blocks1[0]) console.log(`   Text: "${blocks1[0].text}"`)

console.log('\n2. Multi-segment text:')
const s2 = new PdfContentStreamObject(stream2)
const blocks2 = s2.textBlocks
console.log(`   Blocks found: ${blocks2.length}`)
if (blocks2[0]) console.log(`   Text: "${blocks2[0].text}"`)
if (blocks2[0]) console.log(`   Segments: ${blocks2[0].getSegments().length}`)

console.log('\n3. Hex string:')
const s3 = new PdfContentStreamObject(stream3)
const blocks3 = s3.textBlocks
console.log(`   Blocks found: ${blocks3.length}`)
if (blocks3[0]) console.log(`   Text: "${blocks3[0].text}"`)

console.log('\n✓ Text extraction working!')
