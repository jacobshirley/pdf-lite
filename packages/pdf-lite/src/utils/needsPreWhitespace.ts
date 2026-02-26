import { PdfBoolean } from '../core/objects/pdf-boolean.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNull } from '../core/objects/pdf-null.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfObject } from '../core/objects/pdf-object.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'

/**
 * Returns true if the given PDF object's serialized form starts with a
 * non-delimiter character, meaning it requires whitespace separation from
 * a preceding token to avoid ambiguous parsing.
 *
 * Self-delimiting types (PdfString, PdfHexadecimal, PdfArray, PdfDictionary)
 * start with `(`, `<`, `[`, or `<<` and do not need a leading space.
 */
export function needsPreWhitespace(
    obj1?: PdfObject,
    obj2?: PdfObject,
): boolean {
    if (!obj1 || !obj2) {
        return false
    }

    if (obj1.postTokens === undefined && obj2.preTokens === undefined) {
        // Undefined means tokens will be generated
        return false
    }

    const tokens = [...(obj1.postTokens ?? []), ...(obj2?.preTokens ?? [])]

    if (tokens.length > 0) {
        return false
    }

    return (
        obj2 instanceof PdfObjectReference ||
        obj2 instanceof PdfNumber ||
        obj2 instanceof PdfNull ||
        obj2 instanceof PdfBoolean
    )
}
