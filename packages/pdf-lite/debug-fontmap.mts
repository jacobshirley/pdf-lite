import { PdfDocument } from './src/index.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]

const fontMap = page.fontMap
for (const [name, font] of fontMap.entries()) {
    console.log(`${name}: fontName=${font.fontName} type=${font.fontType} encoding=${font.encoding} isUnicode=${font.isUnicode}`)
}
