import { PdfFormField } from './pdf-form-field.js'
import { PdfDefaultAppearance } from './pdf-default-appearance.js'
import { PdfChoiceAppearanceStream } from '../appearance/pdf-choice-appearance-stream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { assertEncodable } from '../../errors.js'

/**
 * Choice form field subtype (dropdowns, list boxes).
 */
export class PdfChoiceFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Ch', PdfChoiceFormField)
    }

    generateAppearance(options?: { makeReadOnly?: boolean }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const da = this.defaultAppearance
        if (!da) return false

        const value = this.value
        if (!value) return false

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

        assertEncodable(value, isUnicode, reverseEncodingMap, parsed.fontName)

        this._appearanceStream = new PdfChoiceAppearanceStream({
            rect: rect as [number, number, number, number],
            value,
            da: parsed,
            flags: this.flags,
            fontResources,
            isUnicode,
            reverseEncodingMap,
        })

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
