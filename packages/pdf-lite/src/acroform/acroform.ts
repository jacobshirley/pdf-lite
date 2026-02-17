/**
 * Backward-compatible re-export shim.
 * All classes have been moved to dedicated modules.
 */
export { PdfFormField as PdfAcroFormField } from './fields/PdfFormField.js'
export { PdfAcroForm } from './PdfAcroForm.js'
export type { PdfDefaultResourcesDictionary } from './PdfAcroForm.js'
export { PdfFieldType } from './fields/types.js'
export type { PdfAppearanceStreamDictionary } from '../annotations/index.js'
