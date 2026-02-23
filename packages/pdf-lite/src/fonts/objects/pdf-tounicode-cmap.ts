import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'

export class PdfToUnicodeCMapObject extends PdfIndirectObject<PdfStream> {
    constructor(mappings: Map<number, number>) {
        const cmapContent = PdfToUnicodeCMapObject.generateCMap(mappings)
        const stream = new PdfStream({
            header: new PdfDictionary(),
            original: new TextEncoder().encode(cmapContent),
        })
        stream.addFilter('FlateDecode')

        super({ content: stream })
    }

    static generateCMap(mappings: Map<number, number>): string {
        const lines: string[] = []

        lines.push('/CIDInit /ProcSet findresource begin')
        lines.push('12 dict begin')
        lines.push('begincmap')
        lines.push('/CIDSystemInfo')
        lines.push('<< /Registry (Adobe)')
        lines.push('/Ordering (UCS)')
        lines.push('/Supplement 0')
        lines.push('>> def')
        lines.push('/CMapName /Adobe-Identity-UCS def')
        lines.push('/CMapType 2 def')
        lines.push('1 begincodespacerange')
        lines.push('<0000> <FFFF>')
        lines.push('endcodespacerange')

        const sortedMappings = Array.from(mappings.entries()).sort(
            (a, b) => a[0] - b[0],
        )

        for (let i = 0; i < sortedMappings.length; i += 100) {
            const chunk = sortedMappings.slice(i, i + 100)
            lines.push(`${chunk.length} beginbfchar`)

            for (const [cid, unicode] of chunk) {
                const cidHex = cid.toString(16).padStart(4, '0').toUpperCase()
                const unicodeHex = unicode
                    .toString(16)
                    .padStart(4, '0')
                    .toUpperCase()
                lines.push(`<${cidHex}> <${unicodeHex}>`)
            }

            lines.push('endbfchar')
        }

        lines.push('endcmap')
        lines.push('CMapName currentdict /CMap defineresource pop')
        lines.push('end')
        lines.push('end')

        return lines.join('\n')
    }
}
