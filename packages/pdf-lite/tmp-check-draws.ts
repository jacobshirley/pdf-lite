import { readFileSync, writeFileSync } from 'fs'
import { PdfDocument } from './src/pdf/pdf-document.js'
import { XfaToAcroFormConverter } from './src/acroform/xfa/xfa-to-acroform.js'
import { PdfXfaTemplate } from './src/acroform/xfa/xfa-template.js'
import { executeXfaScripts } from './src/acroform/xfa/xfa-script-engine.js'

async function main() {
    const bytes = readFileSync(
        './test/unit/fixtures/protectedAdobeLivecycle.pdf',
    )
    const doc = await PdfDocument.fromBytes([new Uint8Array(bytes)])
    doc.setPassword('')

    // First test script execution standalone
    const xfa = await doc.acroForm.getXfa()
    if (!xfa?.template) {
        console.log('No template')
        return
    }

    console.log('=== Testing script execution ===')
    const results = executeXfaScripts(xfa.template)
    console.log(`Script results: ${results.size} fields affected`)
    for (const [path, result] of results) {
        if (result.addedItems) {
            console.log(
                `  ${path}: ${result.addedItems.length} dropdown items added`,
            )
            if (result.addedItems.length > 0) {
                console.log(
                    `    first: "${result.addedItems[0].displayText}" = ${result.addedItems[0].exportValue}`,
                )
                console.log(
                    `    last: "${result.addedItems[result.addedItems.length - 1].displayText}" = ${result.addedItems[result.addedItems.length - 1].exportValue}`,
                )
            }
        }
        if (result.rawValue != null) {
            console.log(`  ${path}: rawValue = "${result.rawValue}"`)
        }
        if (result.presence) {
            console.log(`  ${path}: presence = "${result.presence}"`)
        }
    }

    // Now do the full conversion
    console.log('\n=== Full conversion ===')
    const doc2 = await PdfDocument.fromBytes([new Uint8Array(bytes)])
    doc2.setPassword('')
    const count = await XfaToAcroFormConverter.convert(doc2)
    console.log(`Converted ${count} fields`)

    const output = doc2.toBytes()
    writeFileSync('/tmp/xfa-test-output.pdf', Buffer.from(output))
    console.log('Wrote /tmp/xfa-test-output.pdf')
}
main().catch(console.error)
