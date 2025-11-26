// Decoder usage example

import { PdfDecoder } from 'pdf-lite/core/decoder'
import { PdfByteStreamTokeniser } from 'pdf-lite/core/tokeniser'
import { pdfDecoder } from 'pdf-lite/core/generators'
import { PdfObject } from 'pdf-lite/core/objects/pdf-object'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfTrailer } from 'pdf-lite/core/objects/pdf-trailer'
import { PdfXRefTable } from 'pdf-lite/core/objects/pdf-xref-table'
import { PdfComment } from 'pdf-lite/core/objects/pdf-comment'
import { PdfStartXRef } from 'pdf-lite/core/objects/pdf-start-xref'
import { stringToBytes } from 'pdf-lite/utils/stringToBytes'

/**
 * This example demonstrates how to use the PdfDecoder
 * to decode PDF tokens into PDF objects.
 *
 * The decoder transforms a stream of tokens (from the tokeniser)
 * into high-level PDF objects like dictionaries, arrays, streams,
 * and indirect objects.
 */

// Sample PDF content to decode
const pdfContent = `%PDF-2.0
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Hello!) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000118 00000 n
0000000217 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
310
%%EOF`

// Method 1: Using the pdfDecoder generator (recommended)
console.log('PDF Decoder Example - Using pdfDecoder Generator')
console.log('================================================\n')

const bytes = stringToBytes(pdfContent)
const objects: PdfObject[] = []

for (const obj of pdfDecoder([bytes])) {
    objects.push(obj)
}

console.log(`Decoded ${objects.length} PDF objects:\n`)

for (const obj of objects) {
    const type = obj.constructor.name

    if (obj instanceof PdfComment) {
        console.log(`  ${type}: ${obj.toString().trim()}`)
    } else if (obj instanceof PdfIndirectObject) {
        const contentType = obj.content.constructor.name
        console.log(
            `  ${type}: ${obj.objectNumber} ${obj.generationNumber} obj (${contentType})`,
        )

        // Show dictionary keys if content is a dictionary or stream
        if (obj.content instanceof PdfDictionary) {
            const keys = Object.keys(obj.content.values)
            console.log(`    Keys: ${keys.join(', ')}`)
        }
        if (obj.content instanceof PdfStream) {
            console.log(
                `    Stream length: ${obj.content.original.length} bytes`,
            )
        }
    } else if (obj instanceof PdfXRefTable) {
        console.log(`  ${type}: ${obj.entries.length} entries`)
    } else if (obj instanceof PdfTrailer) {
        const size = obj.dict.get('Size')?.toString() ?? 'unknown'
        console.log(`  ${type}: Size=${size}`)
    } else if (obj instanceof PdfStartXRef) {
        console.log(`  ${type}: offset=${obj.offset}`)
    } else {
        console.log(`  ${type}`)
    }
}

// Method 2: Using the PdfDecoder class directly with a tokeniser
console.log('\n\nPDF Decoder Example - Manual Pipeline')
console.log('======================================\n')

const tokeniser = new PdfByteStreamTokeniser()
const decoder = new PdfDecoder({ ignoreWhitespace: true })

// Feed bytes to tokeniser
tokeniser.feedBytes(bytes)
tokeniser.eof = true

// Feed tokens to decoder
for (const token of tokeniser.nextItems()) {
    decoder.feed(token)
}
decoder.eof = true

// Collect decoded objects
const manualObjects: PdfObject[] = []
for (const obj of decoder.nextItems()) {
    manualObjects.push(obj)
}

console.log(`Decoded ${manualObjects.length} objects with whitespace ignored\n`)

// Count objects by type
const typeCounts = new Map<string, number>()
for (const obj of manualObjects) {
    const type = obj.constructor.name
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1)
}

console.log('Object type counts:')
for (const [type, count] of typeCounts) {
    console.log(`  ${type}: ${count}`)
}

// Example: Incremental decoding (useful for streaming)
console.log('\n\nIncremental Decoding Example')
console.log('============================\n')

const streamTokeniser = new PdfByteStreamTokeniser()
const streamDecoder = new PdfDecoder()

// Simulate streaming by processing in chunks
const chunkSize = 100
let objectCount = 0

for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    streamTokeniser.feedBytes(chunk)

    // Process available tokens
    for (const token of streamTokeniser.nextItems()) {
        streamDecoder.feed(token)

        // Collect any complete objects
        for (const obj of streamDecoder.nextItems()) {
            objectCount++
            console.log(
                `  Chunk ${Math.floor(i / chunkSize) + 1}: Found ${obj.constructor.name}`,
            )
        }
    }
}

// Finalize
streamTokeniser.eof = true
streamDecoder.eof = true

for (const token of streamTokeniser.nextItems()) {
    streamDecoder.feed(token)
}

for (const obj of streamDecoder.nextItems()) {
    objectCount++
    console.log(`  Final: Found ${obj.constructor.name}`)
}

console.log(`\nTotal objects decoded incrementally: ${objectCount}`)

// Example: Preserving whitespace for round-trip
console.log('\n\nRound-Trip Example (Preserving Whitespace)')
console.log('==========================================\n')

const simpleDict = `<< /Type /Page /MediaBox [0 0 612 792] >>`
const preservingDecoder = pdfDecoder([stringToBytes(simpleDict)], {
    ignoreWhitespace: false,
})

for (const obj of preservingDecoder) {
    // toString() will recreate the original representation
    const reconstructed = obj.toString()
    console.log('Original:     ', JSON.stringify(simpleDict))
    console.log('Reconstructed:', JSON.stringify(reconstructed))
    console.log('Match:', simpleDict === reconstructed)
}
