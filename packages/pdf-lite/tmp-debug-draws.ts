import { readFileSync } from 'fs'
import { PdfDocument } from './src/pdf/pdf-document.js'
import { XMLParser } from 'fast-xml-parser'

function ensureArray(val: any): any[] {
    if (val == null) return []
    return Array.isArray(val) ? val : [val]
}

async function main() {
    const bytes = readFileSync(
        './test/unit/fixtures/protectedAdobeLivecycle.pdf',
    )
    const doc = await PdfDocument.fromBytes([new Uint8Array(bytes)])
    doc.setPassword('')

    const xfa = await doc.acroForm.getXfa()
    if (!xfa?.template) {
        console.log('No template')
        return
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        isArray: (tagName) =>
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
            ].includes(tagName),
        textNodeName: '#text',
        trimValues: false,
    })

    const parsed = parser.parse(xfa.template)
    const root = Array.isArray(parsed.template)
        ? parsed.template[0]
        : parsed.template

    // Collect draw elements with their properties
    let count = 0
    function findDraws(node: any, depth: number) {
        if (!node || typeof node !== 'object') return

        for (const d of ensureArray(node.draw)) {
            count++
            const name = d['@_name'] || '?'
            const x = d['@_x'] || '-'
            const y = d['@_y'] || '-'
            const w = d['@_w'] || '-'
            const h = d['@_h'] || '-'

            // Get text content
            let text = ''
            const valueNode = d.value
            if (valueNode) {
                const v = Array.isArray(valueNode) ? valueNode[0] : valueNode
                if (v?.text) {
                    const t = ensureArray(v.text)[0]
                    text = typeof t === 'string' ? t : (t?.['#text'] ?? '')
                }
                if (v?.exData) {
                    const e = Array.isArray(v.exData) ? v.exData[0] : v.exData
                    text = typeof e === 'string' ? e : (e?.['#text'] ?? '')
                }
            }

            // Get border/fill info
            let hasBorder = false
            let hasFill = false
            let fillColor = ''
            let borderEdge = ''
            const border = d.border
            if (border) {
                const b = Array.isArray(border) ? border[0] : border
                hasBorder = true
                const edge = b?.edge
                if (edge) {
                    const e = Array.isArray(edge) ? edge[0] : edge
                    borderEdge = `stroke=${e?.['@_stroke'] || 'solid'} presence=${e?.['@_presence'] || 'visible'} thickness=${e?.['@_thickness'] || '?'}`
                }
                const fill = b?.fill
                if (fill && typeof fill === 'object') {
                    hasFill = true
                    const color = fill?.color
                    if (color) {
                        const c = Array.isArray(color) ? color[0] : color
                        fillColor = c?.['@_value'] || ''
                    }
                }
            }

            // Get font info
            let fontInfo = ''
            const font = d.font
            if (font) {
                const f = Array.isArray(font) ? font[0] : font
                fontInfo = `size=${f?.['@_size'] || '?'} weight=${f?.['@_weight'] || '?'} typeface=${f?.['@_typeface'] || '?'}`
            }

            // Get para info
            let paraInfo = ''
            const para = d.para
            if (para) {
                const p = Array.isArray(para) ? para[0] : para
                paraInfo = `hAlign=${p?.['@_hAlign'] || '?'} vAlign=${p?.['@_vAlign'] || '?'} marginLeft=${p?.['@_marginLeft'] || '?'}`
            }

            if (count <= 40) {
                const shortText = String(text)
                    .replace(/\n/g, '\\n')
                    .substring(0, 80)
                console.log(
                    `[${count}] ${name}: pos=(${x},${y}) size=(${w},${h})`,
                )
                if (shortText) console.log(`     text: "${shortText}"`)
                if (hasBorder) console.log(`     border: ${borderEdge}`)
                if (hasFill) console.log(`     fill: ${fillColor}`)
                if (fontInfo) console.log(`     font: ${fontInfo}`)
                if (paraInfo) console.log(`     para: ${paraInfo}`)
            }
        }

        for (const child of ensureArray(node.subform))
            findDraws(child, depth + 1)
        for (const child of ensureArray(node.area)) findDraws(child, depth + 1)
    }

    findDraws(root, 0)
    console.log(`\nTotal draw elements: ${count}`)
}

main().catch(console.error)
