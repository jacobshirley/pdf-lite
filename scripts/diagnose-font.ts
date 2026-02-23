import { PdfDocument } from '../packages/pdf-lite/src/index.js'
import { PdfAcroForm } from '../packages/pdf-lite/src/acroform/pdf-acro-form.js'
import { PdfDictionary } from '../packages/pdf-lite/src/core/objects/pdf-dictionary.js'
import { PdfObjectReference } from '../packages/pdf-lite/src/core/objects/pdf-object-reference.js'
import { PdfStream } from '../packages/pdf-lite/src/core/objects/pdf-stream.js'
import * as fs from 'fs'

const pdf =
    '/Users/jakeshirley/Documents/GitHub/svat-api/packages/common/pdf-filling-v2/test/unit/tmp/filled-template.pdf'
const pdfDoc = await PdfDocument.fromBytes([fs.readFileSync(pdf)])
const acroform = await pdfDoc.acroForm.read()
if (!acroform) throw new Error('missing acroform')

console.log('=== Fields ===')
for (const field of acroform.fields) {
    const ap = (field as any).content.get('AP')
    const apStr =
        ap instanceof PdfDictionary
            ? `AP.N=${(() => {
                  const n = ap.get('N' as any)
                  return n instanceof PdfObjectReference
                      ? n.objectNumber
                      : typeof n
              })()}`
            : 'no AP'
    console.log(
        `  field obj#${(field as any).objectNumber} name="${field.name}" type=${field.fieldType} modified=${(field as any).content.isModified()} ${apStr} rect=${JSON.stringify(field.rect)}`,
    )
}

console.log('\n=== Setting values ===')
for (const field of acroform.fields) {
    if (field.fieldType === 'Text') {
        field.value = 'test comp456 PROSZ'
        const ap = (field as any).content.get('AP')
        const apStr =
            ap instanceof PdfDictionary
                ? `AP.N=${(() => {
                      const n = ap.get('N' as any)
                      return n instanceof PdfObjectReference
                          ? n.objectNumber
                          : typeof n
                  })()}`
                : 'no AP'
        console.log(
            `  field obj#${(field as any).objectNumber} name="${field.name}" modified=${(field as any).content.isModified()} ${apStr} _appearanceStream=${!!(field as any)._appearanceStream}`,
        )
    }
}

// Patch write to log setAppearanceReference calls
const origWrite = (PdfAcroForm.prototype as any).write
// We'll patch setAppearanceReference on each field to log
for (const field of acroform.fields) {
    const origSAR = (field as any).setAppearanceReference?.bind(field)
    if (origSAR) {
        ;(field as any).setAppearanceReference = function (
            ref: PdfObjectReference,
            ref2?: PdfObjectReference,
        ) {
            console.log(
                `  setAppearanceReference called on field obj#${(field as any).objectNumber} name="${field.name}" newRef=${ref?.objectNumber}`,
            )
            origSAR(ref, ref2)
            const ap = (field as any).content.get('AP')
            if (ap instanceof PdfDictionary) {
                const n = ap.get('N' as any)
                console.log(
                    `    -> AP.N is now ${n instanceof PdfObjectReference ? n.objectNumber : typeof n}`,
                )
            }
        }
    }
}

console.log('\n=== Writing ===')
await pdfDoc.acroForm.write(acroform)
fs.writeFileSync('./output.pdf', pdfDoc.toBytes())
console.log('Wrote output.pdf')

console.log('\n=== After write: field AP state ===')
for (const field of acroform.fields) {
    const ap = (field as any).content.get('AP')
    const apStr =
        ap instanceof PdfDictionary
            ? `AP.N=${(() => {
                  const n = ap.get('N' as any)
                  return n instanceof PdfObjectReference
                      ? n.objectNumber
                      : typeof n
              })()}`
            : 'no AP'
    console.log(
        `  field obj#${(field as any).objectNumber} name="${field.name}" ${apStr}`,
    )
}

// Verify the appearance stream of the Client Name field
const pdfDoc2 = await PdfDocument.fromBytes([fs.readFileSync('./output.pdf')])
const acroform2 = await pdfDoc2.acroForm.read()!
const field2 = acroform2!.fields.find((f) => f.name === 'Client Name')!
console.log(
    `\n=== Round-trip: Client Name field obj#${(field2 as any).objectNumber} ===`,
)
const ap = (field2 as any).content.get('AP' as any)
if (ap instanceof PdfDictionary) {
    const n = ap.get('N' as any)
    console.log(
        `AP.N = ${n instanceof PdfObjectReference ? n.objectNumber : typeof n}`,
    )
    if (n instanceof PdfObjectReference) {
        const obj = await pdfDoc2.readObject({
            objectNumber: n.objectNumber,
            generationNumber: n.generationNumber,
        })
        const stream = obj?.content
        if (stream instanceof PdfStream) {
            const resources = stream.header.get('Resources' as any)
            if (resources instanceof PdfDictionary) {
                const fontDict = resources.get('Font' as any)
                if (fontDict instanceof PdfDictionary) {
                    console.log(
                        'AP Resources.Font:',
                        [...fontDict.entries()]
                            .map(
                                ([k, v]) =>
                                    `${k}=${v instanceof PdfObjectReference ? v.objectNumber : '?'}`,
                            )
                            .join(', '),
                    )
                }
            }
            const content = Buffer.from(stream.decode()).toString('utf8')
            console.log('AP content stream:')
            console.log(content)
        }
    }
} else {
    console.log('NO AP on Client Name field in round-trip!')
}
