import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfContentStream } from '../../content/pdf-content-stream.js'
import type { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'
import type { PdfFont } from '../../fonts/pdf-font.js'

/**
 * Base class for PDF appearance streams (Form XObjects).
 * Extends PdfContentStream with Form XObject metadata (BBox, Resources).
 */
export class PdfAppearanceStream extends PdfContentStream {
    constructor(options: {
        x?: number
        y?: number
        width?: number
        height?: number
        contentStream?: string
        resources?: PdfDictionary
    }) {
        const appearanceDict = new PdfDictionary()
        appearanceDict.set('Type', new PdfName('XObject'))
        appearanceDict.set('Subtype', new PdfName('Form'))
        appearanceDict.set('FormType', new PdfNumber(1))
        appearanceDict.set(
            'BBox',
            new PdfArray([
                new PdfNumber(options.x ?? 0),
                new PdfNumber(options.y ?? 0),
                new PdfNumber(options.width ?? 100),
                new PdfNumber(options.height ?? 100),
            ]),
        )

        if (options.resources) {
            appearanceDict.set('Resources', options.resources)
        }

        super({
            header: appearanceDict,
            contentStream: options.contentStream,
        })
    }
}
