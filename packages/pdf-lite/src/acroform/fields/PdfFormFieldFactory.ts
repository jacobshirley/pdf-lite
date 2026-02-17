import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfFormField } from './PdfFormField.js'
import { PdfTextFormField } from './PdfTextFormField.js'
import { PdfButtonFormField } from './PdfButtonFormField.js'
import { PdfChoiceFormField } from './PdfChoiceFormField.js'
import { PdfSignatureFormField } from './PdfSignatureFormField.js'
import type { FormContext } from './types.js'

/**
 * Creates the correct PdfFormField subclass based on the FT entry in the PDF dictionary.
 */
export class PdfFormFieldFactory {
    static create(options: {
        other: PdfIndirectObject
        form: FormContext<PdfFormField>
        parent?: PdfFormField
    }): PdfFormField {
        let ft: string | undefined
        try {
            const dict = options.other.content.as(PdfDictionary)
            ft = dict.get('FT')?.as(PdfName)?.value
        } catch {
            // content may not be a dictionary
        }

        if (!ft && options.parent) {
            try {
                ft = options.parent.content.get('FT')?.as(PdfName)?.value
            } catch {
                // ignore
            }
        }

        switch (ft) {
            case 'Tx':
                return new PdfTextFormField(options)
            case 'Btn':
                return new PdfButtonFormField(options)
            case 'Ch':
                return new PdfChoiceFormField(options)
            case 'Sig':
                return new PdfSignatureFormField(options)
            default:
                return new PdfFormField(options)
        }
    }
}
