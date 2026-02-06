import { PdfDocument } from 'pdf-lite'
import fs, { mkdirSync, writeFileSync } from 'fs'
import { expect, test } from 'vitest'
const pdfPath =
    '/Users/jakeshirley/Documents/simplyvat/svat-api/products/templates/tmp/PL_VAT-R-13__Form_8_.pdf'

test('Load and save PDF with AcroForm', async () => {
    const original = fs.readFileSync(pdfPath)
    console.log('Loaded PDF, size:', original.length)
    const doc = await PdfDocument.fromBytes([original])
    console.log('Parsed PDF')
    mkdirSync(`${import.meta.dirname}/tmp/`, { recursive: true })
    const bytes = doc.toBytes()
    console.log('Serialized bytes length:', bytes.length)

    writeFileSync(`${import.meta.dirname}/tmp/acroform_test_output.pdf`, bytes)

    // Read back and compare
    const bytesFromFile = fs.readFileSync(
        `${import.meta.dirname}/tmp/acroform_test_output.pdf`,
    )
    console.log('Bytes from file length:', bytesFromFile.length)

    for (let i = 0; i < Math.max(original.length, bytesFromFile.length); i++) {
        if (original[i] !== bytesFromFile[i]) {
            const surroundingBytes = 100
            const start = Math.max(0, i - surroundingBytes)
            const end = Math.min(original.length, i + surroundingBytes)
            console.log(
                'Original bytes around difference:',
                original.slice(start, end).toString('utf-8'),
            )
            console.log(
                'Saved bytes around difference:',
                bytesFromFile.slice(start, end).toString('utf-8'),
            )
            console.log(
                `Files differ at byte index ${i}: original=${original[i]}, saved=${bytesFromFile[i]}, original_char=${String.fromCharCode(original[i]!)}, saved_char=${String.fromCharCode(bytesFromFile[i]!)}`,
            )
            break
        }
    }

    // Verify the saved PDF can be parsed
    console.time('Parse saved PDF')
    const readPdfFromFile = await PdfDocument.fromBytes([bytesFromFile])
    console.timeEnd('Parse saved PDF')
    console.log('✓ Saved PDF parsed successfully')

    // Parse acroform to verify full compatibility
    console.time('Parse acroform')
    const acroform = await readPdfFromFile.acroForm.read()
    console.timeEnd('Parse acroform')
    console.log(acroform?.exportData())

    //expect(file.length).toEqual(file2.length)
    //expect(original.toString('utf-8')).toEqual(file2.toString('utf-8'))
    //expect(doc.toString()).toEqual(file.toString('utf-8'))
}, 30000)
