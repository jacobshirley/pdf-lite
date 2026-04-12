import { PdfContentStreamTokeniser } from './src/graphics/tokeniser.ts'

const content1 = '100 700 Td'
const content2 = '1 0 0 1 100 700 Tm'

console.log('Testing tokenizer:\n')

console.log('1. Parsing "100 700 Td":')
const ops1 = PdfContentStreamTokeniser.tokenise(content1)
console.log(`  Found ${ops1.length} ops`)
if (ops1[0]) console.log(`  Op toString(): "${ops1[0].toString()}"`)
if (ops1[0]) console.log(`  Op constructor name: ${ops1[0].constructor.name}`)

console.log('\n2. Parsing "1 0 0 1 100 700 Tm":')
const ops2 = PdfContentStreamTokeniser.tokenise(content2)
console.log(`  Found ${ops2.length} ops`)
if (ops2[0]) console.log(`  Op toString(): "${ops2[0].toString()}"`)
if (ops2[0]) console.log(`  Op constructor name: ${ops2[0].constructor.name}`)
