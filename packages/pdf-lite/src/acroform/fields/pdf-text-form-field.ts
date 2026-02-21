import { PdfFormField } from './pdf-form-field.js'
import { PdfDefaultAppearance } from './pdf-default-appearance.js'
import { PdfTextAppearanceStream } from '../appearance/pdf-text-appearance-stream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'

/**
 * Text form field subtype.
 */
export class PdfTextFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Tx', PdfTextFormField, {
            fallback: true,
        })
    }

    generateAppearance(options?: {
        makeReadOnly?: boolean
        textYOffset?: number
    }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const da = this.defaultAppearance
        if (!da) return false

        const parsed = PdfDefaultAppearance.parse(da)
        if (!parsed) return false

        let fontResources: PdfDictionary | undefined
        const drFontValue = this.form?.defaultResources?.get('Font')
        const drFonts =
            drFontValue instanceof PdfDictionary ? drFontValue : undefined
        const daFontRef = this.form?.fontRefs?.get(parsed.fontName)

        if (drFonts || daFontRef) {
            // Build a fresh font dict using clean PdfObjectReferences (no
            // pre/postTokens inherited from the original parse context).
            const fontDict = new PdfDictionary()
            if (drFonts) {
                for (const [key, val] of drFonts.entries()) {
                    if (val instanceof PdfObjectReference) {
                        fontDict.set(
                            key,
                            new PdfObjectReference(
                                val.objectNumber,
                                val.generationNumber,
                            ),
                        )
                    } else if (val != null) {
                        fontDict.set(key, val)
                    }
                }
            }
            if (daFontRef && !fontDict.has(parsed.fontName)) {
                fontDict.set(
                    parsed.fontName,
                    new PdfObjectReference(
                        daFontRef.objectNumber,
                        daFontRef.generationNumber,
                    ),
                )
            }
            fontResources = new PdfDictionary()
            fontResources.set('Font', fontDict)
        }

        const isUnicode = this.form?.isFontUnicode(parsed.fontName) ?? false
        const encodingMap = this.form?.fontEncodingMaps?.get(parsed.fontName)
        const reverseEncodingMap: Map<string, number> | undefined = encodingMap
            ? new Map(Array.from(encodingMap, ([code, char]) => [char, code]))
            : undefined

        this._appearanceStream = new PdfTextAppearanceStream({
            rect: rect,
            value: this.value,
            da: parsed,
            multiline: this.multiline,
            comb: this.comb,
            maxLen: this.maxLen,
            fontResources,
            isUnicode,
            reverseEncodingMap,
        })

        if (options?.makeReadOnly) {
            this.readOnly = true
            if (!this.print) this.print = true
            this.noZoom = true
        } else {
            if (!this.print) this.print = true
        }
        return true
    }
}
