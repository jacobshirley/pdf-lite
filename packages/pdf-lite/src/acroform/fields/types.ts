import type { PdfDefaultResourcesDictionary } from '../acroform.js'
import type { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfFont } from '../../fonts/pdf-font.js'

/**
 * Field types for AcroForm fields
 */
export const PdfFieldType = {
    Text: 'Tx',
    Button: 'Btn',
    Choice: 'Ch',
    Signature: 'Sig',
} as const

export type PdfFieldType = keyof typeof PdfFieldType

/**
 * Interface that PdfAcroForm implements, used by PdfFormField to avoid circular imports.
 * Uses generic field type to avoid circular dependency.
 */
export interface FormContext<TField = any> {
    defaultResources: PdfDefaultResourcesDictionary | null
    defaultAppearance: string | null
    fields: TField[]
    getFontByName(name: string): PdfFont | undefined
}
