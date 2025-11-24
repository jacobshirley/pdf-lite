// Modifying XFA XML in a PDF example

import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import { stringToBytes } from 'pdf-lite/utils/stringToBytes'
import { bytesToString } from 'pdf-lite/utils/bytesToString'
import { readFile, writeFile } from 'fs/promises'

// This example demonstrates how to read, modify, and save XFA XML data in a PDF.
// XFA (XML Forms Architecture) is used in dynamic PDF forms created with Adobe LiveCycle.

// Load a PDF file containing XFA data
const pdfBytes = await readFile('xfa-form.pdf')
const document = await PdfDocument.fromBytes([pdfBytes])

// If the PDF is encrypted, set the password
// document.setPassword('your-password')

// Find the AcroForm dictionary which contains the XFA reference
const rootDict = document.rootDictionary
if (!rootDict) {
    throw new Error('Document has no root dictionary')
}

const acroFormRef = rootDict.get('AcroForm')?.as(PdfObjectReference)
if (!acroFormRef) {
    throw new Error('Document has no AcroForm (not an XFA PDF)')
}

const acroFormObj = await document.readObject({
    objectNumber: acroFormRef.objectNumber,
    generationNumber: acroFormRef.generationNumber,
})
if (!acroFormObj) {
    throw new Error('Could not read AcroForm object')
}

const acroFormDict = acroFormObj.content.as(PdfDictionary)
const xfaEntry = acroFormDict.get('XFA')
if (!xfaEntry) {
    throw new Error('AcroForm has no XFA entry')
}

// XFA can be either:
// 1. A single stream reference containing the entire XDP document
// 2. An array of alternating names and stream references (packeted XFA)

if (xfaEntry instanceof PdfArray) {
    // Packeted XFA - array of [name, streamRef, name, streamRef, ...]
    // Common packets: "xdp:xdp", "config", "template", "localeSet",
    //                 "datasets", "form", "</xdp:xdp>"
    console.log('Found packeted XFA with the following components:')

    for (let i = 0; i + 1 < xfaEntry.items.length; i += 2) {
        const packetName = xfaEntry.items[i]
        const streamRef = xfaEntry.items[i + 1]

        if (packetName instanceof PdfString && streamRef instanceof PdfObjectReference) {
            console.log(`  - ${bytesToString(packetName.raw)}`)

            // Read the stream object
            const streamObj = await document.readObject({
                objectNumber: streamRef.objectNumber,
                generationNumber: streamRef.generationNumber,
            })

            if (streamObj) {
                const stream = streamObj.content.as(PdfStream)
                // Remove compression to get the XML
                stream.removeAllFilters()
                const xmlContent = new TextDecoder().decode(stream.decode())

                // Example: modify the "datasets" packet which contains form data
                if (bytesToString(packetName.raw) === 'datasets') {
                    console.log('\nOriginal datasets XML (truncated):')
                    console.log(xmlContent.substring(0, 500) + '...')

                    // Modify the XML content
                    // For example, update a field value
                    const modifiedXml = xmlContent.replace(
                        /<FieldName>.*?<\/FieldName>/g,
                        '<FieldName>New Value</FieldName>'
                    )

                    // Update the stream with the modified XML
                    stream.raw = stringToBytes(modifiedXml)

                    // Optionally re-compress the stream
                    stream.addFilter('FlateDecode')

                    console.log('\nDatasets XML has been modified.')
                }
            }
        }
    }
} else if (xfaEntry instanceof PdfObjectReference) {
    // Single stream containing entire XDP document
    const xfaStreamObj = await document.readObject({
        objectNumber: xfaEntry.objectNumber,
        generationNumber: xfaEntry.generationNumber,
    })

    if (xfaStreamObj) {
        const stream = xfaStreamObj.content.as(PdfStream)
        stream.removeAllFilters()
        const xmlContent = new TextDecoder().decode(stream.decode())

        console.log('Found single-stream XFA document')
        console.log('XDP content (truncated):')
        console.log(xmlContent.substring(0, 500) + '...')

        // Modify the XML as needed
        const modifiedXml = xmlContent.replace(
            /<SomeElement>.*?<\/SomeElement>/g,
            '<SomeElement>Modified Value</SomeElement>'
        )

        // Update the stream
        stream.raw = stringToBytes(modifiedXml)
        stream.addFilter('FlateDecode')
    }
}

// Enable incremental updates to preserve existing signatures if any
document.setIncremental(true)

// Commit changes
await document.commit()

// Save the modified PDF
await writeFile('xfa-form-modified.pdf', document.toBytes())
console.log('\nModified PDF saved to xfa-form-modified.pdf')
