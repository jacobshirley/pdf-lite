/**
 * Backward-compatible re-export shim.
 * All classes have been moved to dedicated modules.
 */
export { PdfFormField as PdfAcroFormField } from './fields/pdf-form-field.js'
export { PdfAcroFormObject as PdfAcroForm } from './objects/pdf-acro-form.js'
export type { PdfDefaultResourcesDictionary } from './objects/pdf-acro-form.js'
export { PdfFieldType } from './fields/types.js'
export type { PdfAppearanceStreamDictionary } from '../annotations/index.js'
