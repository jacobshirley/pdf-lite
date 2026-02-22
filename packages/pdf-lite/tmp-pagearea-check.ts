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

    // Search for POLTAX or "POLA JASNE" or "Nr dokumentu" or "Status" in ALL draws
    function search(node: any, path: string) {
        if (!node || typeof node !== 'object') return
        for (const d of ensureArray(node.draw)) {
            const str = JSON.stringify(d)
            if (
                str.includes('POLTAX') ||
                str.includes('POLA JASNE') ||
                str.includes('Nr dokumentu') ||
                str.includes('Status') ||
                str.includes('Skladanie')
            ) {
                const name = d['@_name'] || '?'
                console.log(`${path} draw "${name}": ${str.substring(0, 200)}`)
            }
        }
        // Also check fields
        for (const f of ensureArray(node.field)) {
            const str = JSON.stringify(f)
            if (
                str.includes('POLTAX') ||
                str.includes('POLA JASNE') ||
                str.includes('Nr dokumentu') ||
                str.includes('Skladanie')
            ) {
                const name = f['@_name'] || '?'
                console.log(`${path} FIELD "${name}": ${str.substring(0, 200)}`)
            }
        }
        for (const sf of ensureArray(node.subform))
            search(sf, path + '/' + (sf['@_name'] || '?'))
        for (const ar of ensureArray(node.area))
            search(ar, path + '/area:' + (ar['@_name'] || '?'))
    }

    search(root, 'root')
}

main().catch(console.error)
