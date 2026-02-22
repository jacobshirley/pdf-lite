import { readFileSync } from 'fs'
import { PdfDocument } from './src/pdf/pdf-document.js'
import { XMLParser } from 'fast-xml-parser'

function ensureArray(val: any): any[] {
    if (val == null) return []
    return Array.isArray(val) ? val : [val]
}

async function main() {
    const bytes = readFileSync('./test/unit/fixtures/protectedAdobeLivecycle.pdf')
    const doc = await PdfDocument.fromBytes([new Uint8Array(bytes)])
    doc.setPassword('')
    const xfa = await doc.acroForm.getXfa()
    if (!xfa?.template) { console.log('No template'); return }

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        isArray: (tag: string) =>
            ['subform','field','draw','exclGroup','area','contentArea',
             'pageArea','pageSet','items','text','item','event','script','variables'].includes(tag),
        textNodeName: '#text',
        trimValues: false,
    })
    const parsed = parser.parse(xfa.template)
    const root = Array.isArray(parsed.template) ? parsed.template[0] : parsed.template

    let scriptCount = 0

    function extractScripts(node: any, nodeType: string, nodeName: string, depth: number) {
        if (!node || typeof node !== 'object') return

        for (const evt of ensureArray(node.event)) {
            const activity = evt?.['@_activity'] || '?'
            const evtName = evt?.['@_name'] || ''
            for (const scr of ensureArray(evt?.script)) {
                scriptCount++
                const code = typeof scr === 'string' ? scr : (scr?.['#text'] || '')
                const contentType = typeof scr === 'object' ? (scr?.['@_contentType'] || '') : ''
                console.log(`\n=== Script #${scriptCount} ===`)
                console.log(`  Node: ${nodeType} "${nodeName}" (depth ${depth})`)
                console.log(`  Event: activity="${activity}" name="${evtName}"`)
                console.log(`  ContentType: ${contentType}`)
                console.log(`  Code:\n${code}`)
            }
        }

        for (const vars of ensureArray(node.variables)) {
            for (const scr of ensureArray(vars?.script)) {
                scriptCount++
                const code = typeof scr === 'string' ? scr : (scr?.['#text'] || '')
                const scrName = typeof scr === 'object' ? (scr?.['@_name'] || '') : ''
                const contentType = typeof scr === 'object' ? (scr?.['@_contentType'] || '') : ''
                console.log(`\n=== Script #${scriptCount} (variables) ===`)
                console.log(`  Node: ${nodeType} "${nodeName}" (depth ${depth})`)
                console.log(`  Variable script name: "${scrName}"`)
                console.log(`  ContentType: ${contentType}`)
                console.log(`  Code:\n${code}`)
            }
        }

        for (const sf of ensureArray(node.subform)) {
            extractScripts(sf, 'subform', sf?.['@_name'] || '?', depth + 1)
        }
        for (const f of ensureArray(node.field)) {
            extractScripts(f, 'field', f?.['@_name'] || '?', depth + 1)
        }
        for (const d of ensureArray(node.draw)) {
            extractScripts(d, 'draw', d?.['@_name'] || '?', depth + 1)
        }
        for (const a of ensureArray(node.area)) {
            extractScripts(a, 'area', a?.['@_name'] || '?', depth + 1)
        }
        for (const g of ensureArray(node.exclGroup)) {
            extractScripts(g, 'exclGroup', g?.['@_name'] || '?', depth + 1)
            for (const f of ensureArray(g?.field)) {
                extractScripts(f, 'field', f?.['@_name'] || '?', depth + 2)
            }
        }
    }

    extractScripts(root, 'root', 'template', 0)
    console.log(`\n\nTotal scripts found: ${scriptCount}`)
}
main().catch(console.error)
