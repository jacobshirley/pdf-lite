import { PdfFormField } from './pdf-form-field.js'
import { PdfAppearanceStream } from '../appearance/pdf-appearance-stream.js'
import { PdfSignatureObject } from '../../signing/signatures/base.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfSigner } from '../../signing/signer.js'

/**
 * Signature form field (FT = /Sig).
 *
 * An AcroForm widget whose `/V` is a signature dictionary (see
 * {@link PdfSignatureObject}).  Use this class to create visible
 * placeholders for signatures in a document; the actual cryptographic
 * signing is handled separately by a {@link PdfSignatureObject}.
 *
 * Unsigned fields have no `/V` entry.  Attaching a {@link PdfSignatureObject}
 * (or referencing an indirect {@link PdfSignatureObject}) via
 * {@link signature} flips `isSigned` to `true`.
 */
export class PdfSignatureFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Sig', PdfSignatureFormField)
    }

    /**
     * Create a blank signature-placeholder field not yet attached to any
     * document.  The caller is responsible for adding this field (and its
     * widget) to the document's AcroForm and the target page's `/Annots`.
     *
     * (Named `blank` rather than `createPlaceholder` to avoid shadowing
     * `PdfIndirectObject.createPlaceholder`.)
     */
    static blank(
        options: {
            name?: string
            rect?: [number, number, number, number]
        } = {},
    ): PdfSignatureFormField {
        const field = new PdfSignatureFormField()
        field.fieldType = 'Signature'
        field.isWidget = true
        field.name = options.name ?? `Signature_${Date.now().toString(36)}`
        field.rect = options.rect ?? [0, 0, 200, 60]
        return field
    }

    /**
     * `true` when this field has a signature dictionary attached (i.e. `/V`
     * is set).  Does **not** validate the signature's cryptographic contents.
     */
    get isSigned(): boolean {
        return this.signature !== null
    }

    /**
     * The attached signature dictionary, if any.  Resolves references
     * transparently.  `null` when the field is an unsigned placeholder.
     */
    get signature(): PdfSignatureObject | null {
        const v = this.content.get('V')
        if (v instanceof PdfObjectReference) {
            return PdfSigner.instantiateSignatureObject(v.resolve())
        }
        return null
    }

    /**
     * Attach a signature dictionary to this field.  Accepts either a raw
     * {@link PdfSignatureObject} (stored inline on `/V`) or any
     * {@link PdfIndirectObject} wrapping one (stored as an indirect
     * reference, which is the form Adobe emits).
     *
     * Pass `null` to detach and revert the field to an unsigned placeholder.
     */
    set signature(signature: PdfIndirectObject | null | undefined) {
        if (signature === null || signature === undefined) {
            this.content.delete('V')
            return
        }

        this.content.set('V', signature.reference)
    }

    /**
     * Generate a placeholder appearance for an unsigned signature field: an
     * XObject with the field's bounding box but no drawn content.  Viewers
     * will still render the field's widget border/background.
     *
     * Subclasses that need a richer visual (e.g. "Sign here" label) can
     * override.
     */
    generateAppearance(): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        const appearance = new PdfAppearanceStream({
            width,
            height,
            contentStream: '',
        })
        this.appearanceStream = appearance
        if (!this.print) this.print = true
        return true
    }
}
