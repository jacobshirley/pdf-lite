import type { PdfDefaultResourcesDictionary } from '../acroform.js'

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
    fontEncodingMaps: Map<string, Map<number, string>>
    fields: TField[]
}
