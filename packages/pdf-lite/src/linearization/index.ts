/**
 * PDF Linearization Module
 *
 * Provides functionality to linearize PDF documents for fast web viewing.
 * Linearization reorganizes PDF structure to enable progressive page rendering.
 *
 * @module linearization
 */

export { LinearizationDictionary } from './linearization-dictionary.js'
export { LinearizationParams } from './linearization-params.js'
export { HintTableGenerator } from './hint-table.js'
export { PdfLinearizer } from './pdf-linearizer.js'
