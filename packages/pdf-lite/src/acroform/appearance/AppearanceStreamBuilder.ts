import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import type { PdfDefaultResourcesDictionary } from '../acroform.js'

/**
 * Shared helpers for creating Form XObject appearance streams
 * and resolving font resources.
 */
export class AppearanceStreamBuilder {
    static createFormXObject(
        width: number,
        height: number,
        contentStream: string,
        resources?: PdfDictionary,
    ): PdfStream {
        const appearanceDict = new PdfDictionary()
        appearanceDict.set('Type', new PdfName('XObject'))
        appearanceDict.set('Subtype', new PdfName('Form'))
        appearanceDict.set('FormType', new PdfNumber(1))
        appearanceDict.set(
            'BBox',
            new PdfArray([
                new PdfNumber(0),
                new PdfNumber(0),
                new PdfNumber(width),
                new PdfNumber(height),
            ]),
        )

        if (resources) {
            appearanceDict.set('Resources', resources)
        }

        return new PdfStream({
            header: appearanceDict,
            original: contentStream,
        })
    }

    static resolveFontResources(
        fontName: string,
        fieldDR: PdfDictionary | null | undefined,
        acroformDR: PdfDefaultResourcesDictionary | null | undefined,
    ): PdfDictionary | undefined {
        const fontSource =
            fieldDR?.get('Font')?.as(PdfDictionary) ??
            acroformDR?.get('Font')?.as(PdfDictionary)
        if (!fontSource || !fontName) return undefined

        const fontRef = fontSource.get(fontName)
        if (!fontRef) return undefined

        const resourceFontDict = new PdfDictionary()
        resourceFontDict.set(fontName, fontRef)
        const resourcesDict = new PdfDictionary()
        resourcesDict.set('Font', resourceFontDict)
        return resourcesDict
    }
}
