import { PdfDocument } from './src/index.js'
import { PdfObjectReference } from './src/core/objects/pdf-object-reference.js'
import { PdfStream } from './src/core/objects/pdf-stream.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]

// Check TT0 font dict for ToUnicode and Encoding details
const fontMap = page.fontMap
const tt0 = fontMap.get('TT0')!
console.log('TT0 fontName:', tt0.fontName)
console.log('TT0 type:', tt0.fontType)
console.log('TT0 encoding:', tt0.encoding)

// Check the raw font dictionary
const dict = (tt0 as any).content
const keys = [...dict.keys()]
console.log('TT0 dict keys:', keys.map((k: any) => k.value))

const toUnicode = dict.get('ToUnicode')
console.log('ToUnicode:', toUnicode?.toString?.()?.substring(0, 50))
if (toUnicode instanceof PdfObjectReference) {
    const resolved = toUnicode.resolve()
    if (resolved?.content instanceof PdfStream) {
        const data = resolved.content.dataAsString
        console.log('ToUnicode CMap:\n', data?.substring(0, 500))
    }
}

// Check C2_1 for comparison 
const c21 = fontMap.get('C2_1')!
console.log('\nC2_1 fontName:', c21.fontName)
console.log('C2_1 type:', c21.fontType)
const c21dict = (c21 as any).content
const c21keys = [...c21dict.keys()]
console.log('C2_1 dict keys:', c21keys.map((k: any) => k.value))

// Decode the literal string from BT#5 first show op with both fonts
// Raw bytes: \000D\000V\000\003\000P\000\ ...(CID codes 0044 0056 0003 0050...)
const testCodes = [0x0044, 0x0056, 0x0003, 0x0050, 0x005C, 0x0003, 0x002C, 0x004E, 0x0057, 0x0048, 0x0055, 0x0047, 0x004C, 0x0044, 0x0055, 0x005C]
console.log('\nDecoding CID codes with C2_1:')
for (const code of testCodes) {
    const decoded = c21.decodeCharCode(code)
    process.stdout.write(decoded ?? '?')
}
console.log()

console.log('Decoding single bytes with TT0:')
// Under TT0 (WinAnsi), the literal string bytes are: 0x00, 0x44, 0x00, 0x56, etc.
for (const code of testCodes) {
    const hi = (code >> 8) & 0xff
    const lo = code & 0xff
    const hiChar = tt0.decodeCharCode(hi)
    const loChar = tt0.decodeCharCode(lo)
    process.stdout.write((hiChar ?? '?') + (loChar ?? '?'))
}
console.log()
