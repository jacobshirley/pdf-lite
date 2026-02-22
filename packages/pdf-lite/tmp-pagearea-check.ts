import { readFileSync } from 'fs'
import { PdfDocument } from './src/pdf/pdf-document.js'
import { XMLParser } from 'fast-xml-parser'

function ensureArray(val: any): any[] {
    return val == null ? [] : Array.isArray(val) ? val : [val]
}

async function main() {
    const bytes = readFileSync(
        './test/unit/fixtures/protectedAdobeLivecycle.pdf',
    )
    const doc = await PdfDocument.fromBytes([new Uint8Array(bytes)])
    doc.setPassword('')
    const xfa = await doc.acroForm.getXfa()
    if (!xfa?.template) return

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        isArray: (tag: string) =>
            [
                'subform',
                'field',
                'draw',
                'exclGroup',
                'area',
                'contentArea',
                'pageArea',
                'pageSet',
                'items',
                'text',
                'item',
            ].includes(tag),
        textNodeName: '#text',
        trimValues: false,
    })
    const parsed = parser.parse(xfa.template)
    const root = Array.isArray(parsed.template)
        ? parsed.template[0]
        : parsed.template

    // Dump the ENTIRE pageArea structure
    const topSubforms = ensureArray(root.subform)
    for (const sf of topSubforms) {
        for (const ps of ensureArray(sf.pageSet)) {
            for (const pa of ensureArray(ps.pageArea)) {
                console.log('=== pageArea keys:', Object.keys(pa).join(', '))
                // Dump full JSON (truncated)
                const json = JSON.stringify(pa, null, 2)
                console.log(json.substring(0, 5000))
                if (json.length > 5000)
                    console.log(`\n... (${json.length} total chars)`)
            }
        }
    }
}

main().catch(console.error)
