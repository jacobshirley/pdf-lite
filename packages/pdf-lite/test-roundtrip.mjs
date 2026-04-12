import { PdfContentStreamObject } from './src/graphics/pdf-content-stream.ts'
import { PdfStream } from './src/core/objects/pdf-stream.ts'
import { PdfIndirectObject } from './src/core/objects/pdf-indirect-object.ts'

console.log('Testing round-trip preservation:\n')

const content = 'BT /F1 12 Tf 100 700 Td (Hello) Tj ET'
console.log('Input:', content)

const stream = new PdfStream(content)
const obj = new PdfIndirectObject({ content: stream })
const s = new PdfContentStreamObject(obj)

console.log('\nAfter parsing:')
console.log('Node count:', s.nodes.length)

const tb = s.textBlocks[0]
if (tb) {
    console.log('\nTextBlock ops:')
    for (const op of tb.ops) {
        console.log(' ', op.constructor.name, ':', op.toString(), '| raw:', op.raw)
    }
    
    console.log('\nFirst segment ops:')
    const seg = tb.getSegments()[0]
    if (seg) {
        for (const op of seg.ops) {
            console.log(' ', op.constructor.name, ':', op.toString())
        }
    }
    
    console.log('\ntoString():')
    console.log(tb.toString())
}
