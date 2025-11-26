// Tokeniser usage example

import { PdfByteStreamTokeniser } from 'pdf-lite/core/tokeniser'
import { PdfToken } from 'pdf-lite/core/tokens/token'
import { stringToBytes } from 'pdf-lite/utils/stringToBytes'

/**
 * This example demonstrates how to use the PdfByteStreamTokeniser
 * to tokenize PDF content into individual tokens.
 *
 * The tokeniser converts raw PDF bytes into a stream of tokens that can
 * be further processed by the decoder or used for PDF analysis.
 */

// Sample PDF content to tokenize
const pdfContent = `%PDF-2.0
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
trailer
<< /Size 4 /Root 1 0 R >>
startxref
0
%%EOF`

// Create the tokeniser
const tokeniser = new PdfByteStreamTokeniser()

// Convert the PDF content to bytes and feed it to the tokeniser
const bytes = stringToBytes(pdfContent)
tokeniser.feedBytes(bytes)

// Signal end of input
tokeniser.eof = true

// Collect all tokens
const tokens: PdfToken[] = []
for (const token of tokeniser.nextItems()) {
    tokens.push(token)
}

// Display tokenisation results
console.log('PDF Tokenisation Example')
console.log('========================\n')
console.log(`Input: ${pdfContent.length} bytes`)
console.log(`Output: ${tokens.length} tokens\n`)

// Group tokens by type for summary
const tokenCounts = new Map<string, number>()
for (const token of tokens) {
    const type = token.constructor.name
    tokenCounts.set(type, (tokenCounts.get(type) ?? 0) + 1)
}

console.log('Token type counts:')
for (const [type, count] of tokenCounts) {
    console.log(`  ${type}: ${count}`)
}

console.log('\nFirst 20 tokens:')
for (const token of tokens.slice(0, 20)) {
    const tokenString = token.toString().slice(0, 40)
    const displayString =
        tokenString.length >= 40 ? tokenString + '...' : tokenString
    console.log(
        `  ${token.constructor.name.padEnd(30)} ${JSON.stringify(displayString)}`,
    )
}

// Example: Tokenising incrementally (useful for streaming)
console.log('\n\nIncremental Tokenisation Example')
console.log('=================================\n')

const incrementalTokeniser = new PdfByteStreamTokeniser()

// Feed bytes in chunks (simulating streaming)
const chunkSize = 50
const numChunks = Math.ceil(bytes.length / chunkSize)

console.log(`Processing ${numChunks} chunks of ~${chunkSize} bytes each...`)

let totalTokens = 0
for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    incrementalTokeniser.feedBytes(chunk)

    // Process tokens as they become available
    for (const _ of incrementalTokeniser.nextItems()) {
        totalTokens++
    }
}

// Signal end of input and collect remaining tokens
incrementalTokeniser.eof = true
for (const _ of incrementalTokeniser.nextItems()) {
    totalTokens++
}

console.log(`Total tokens produced: ${totalTokens}`)

// Example: Custom stream chunk size
console.log('\n\nCustom Stream Chunk Size Example')
console.log('================================\n')

const customTokeniser = new PdfByteStreamTokeniser({
    streamChunkSizeBytes: 512, // Customize the chunk size for stream content
})

const streamContent = `1 0 obj
<< /Length 100 >>
stream
This is stream content that will be chunked by the tokeniser.
The chunk size determines how the stream data is delivered.
endstream
endobj`

customTokeniser.feedBytes(stringToBytes(streamContent))
customTokeniser.eof = true

console.log('Tokens from stream content:')
for (const token of customTokeniser.nextItems()) {
    const type = token.constructor.name
    const preview = token.toString().slice(0, 50).replace(/\n/g, '\\n')
    console.log(`  ${type.padEnd(25)} ${JSON.stringify(preview)}`)
}
