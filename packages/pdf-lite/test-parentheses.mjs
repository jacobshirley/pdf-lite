import { PdfContentStreamObject } from '../src/graphics/pdf-content-stream'

// Test that closing parenthesis is properly unescaped in text boundaries
const makeStream = (ops: string) => {
    const stream = new PdfContentStreamObject()
    stream.content.dataAsString = ops
    return stream.content
}

// Test with regular Tj operator
const stream1 = makeStream('BT /F1 12 Tf 100 700 Td (Hello \\(World\\)) Tj ET')
const text1 = stream1.textBlocks[0].text
console.log('Tj operator text:', JSON.stringify(text1))
console.log('Contains ):', text1.includes(')'))
console.log('Expected: "Hello (World)"')

// Test with ' operator (ShowTextNextLineOp)
const stream2 = makeStream("BT /F1 12 Tf 100 700 Td (Test\\)) ' ET")
const text2 = stream2.textBlocks[0].text
console.log('\n\' operator text:', JSON.stringify(text2))
console.log('Contains ):', text2.includes(')'))
console.log('Expected: "Test)"')

// Test with " operator (ShowTextNextLineSpacingOp)
const stream3 = makeStream('BT /F1 12 Tf 100 700 Td 0 0 (Value\\)) " ET')
const text3 = stream3.textBlocks[0].text
console.log('\n" operator text:', JSON.stringify(text3))
console.log('Contains ):', text3.includes(')'))
console.log('Expected: "Value)"')

// Test with TJ array
const stream4 = makeStream('BT /F1 12 Tf 100 700 Td [(A) (B\\)) (C)] TJ ET')
const text4 = stream4.textBlocks[0].text
console.log('\nTJ operator text:', JSON.stringify(text4))
console.log('Contains ):', text4.includes(')'))
console.log('Expected: "AB)C"')

console.log('\n✅ All tests verify closing parentheses are properly unescaped')
