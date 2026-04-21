import { PdfFormField } from './pdf-form-field.js'
import { PdfAppearanceStream } from '../appearance/pdf-appearance-stream.js'
import { PdfSignatureObject } from '../../signing/signatures/index.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'

/**
 * Signature form field (FT = /Sig).
 *
 * An AcroForm widget whose `/V` is an indirect reference to a signature
 * dictionary (see {@link PdfSignatureObject}).  Use this class to create
 * visible placeholders for signatures in a document; the actual
 * cryptographic signing is handled separately by a {@link PdfSignatureObject}.
 */
export class PdfSignatureFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Sig', PdfSignatureFormField)
    }

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

    get isSigned(): boolean {
        return this.signature !== null
    }

    /**
     * The attached signature, resolved into the correct
     * {@link PdfSignatureObject} subclass based on its `/SubFilter`.
     * Returns `null` when unsigned.
     */
    get signature(): PdfSignatureObject | null {
        const v = this.content.get('V')
        if (v instanceof PdfObjectReference) {
            const resolved = v.resolve()
            if (!resolved) return null
            return PdfSignatureObject.fromIndirectObject(resolved)
        }
        return null
    }

    /**
     * Attach a signature by indirect reference. Pass `null` to detach.
     */
    set signature(signature: PdfIndirectObject | null | undefined) {
        if (signature === null || signature === undefined) {
            this.content.delete('V')
            return
        }
        this.content.set('V', signature.reference)
    }

    get signerName(): string | null {
        return this.signature?.signerName ?? null
    }

    set signerName(name: string | null) {
        this.requireSignature().signerName = name
    }

    get reason(): string | null {
        return this.signature?.reason ?? null
    }

    set reason(reason: string | null) {
        this.requireSignature().reason = reason
    }

    get location(): string | null {
        return this.signature?.location ?? null
    }

    set location(location: string | null) {
        this.requireSignature().location = location
    }

    get contactInfo(): string | null {
        return this.signature?.contactInfo ?? null
    }

    set contactInfo(contactInfo: string | null) {
        this.requireSignature().contactInfo = contactInfo
    }

    get signedAt(): Date | null {
        return this.signature?.signedAt ?? null
    }

    set signedAt(date: Date | null) {
        this.requireSignature().signedAt = date
    }

    private requireSignature(): PdfSignatureObject {
        const sig = this.signature
        if (!sig) {
            throw new Error(
                'Field has no signature attached. Assign one via `field.signature = PdfXxxSignatureObject.create({...})` first.',
            )
        }
        return sig
    }

    generateAppearance(): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        const sig = this.signature
        const lines: string[] = []
        if (sig) {
            if (sig.signerName)
                lines.push(`Digitally signed by ${sig.signerName}`)
            if (sig.signedAt) {
                const d = sig.signedAt
                lines.push(
                    `Date: ${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`,
                )
            }
            if (sig.reason) lines.push(`Reason: ${sig.reason}`)
            if (sig.location) lines.push(`Location: ${sig.location}`)
        }

        const fontSize = 9
        const lineHeight = fontSize + 2
        let contentStream = ''
        if (lines.length > 0) {
            const topY = height - lineHeight
            contentStream = `q 0.5 0.5 0.5 RG 0.5 w 0.5 0.5 ${width - 1} ${height - 1} re S Q BT /Helv ${fontSize} Tf 0 g 4 ${topY} Td `
            for (let i = 0; i < lines.length; i++) {
                const text = lines[i]
                    .replace(/\\/g, '\\\\')
                    .replace(/[()]/g, (m) => `\\${m}`)
                if (i > 0) contentStream += `0 -${lineHeight} Td `
                contentStream += `(${text}) Tj `
            }
            contentStream += 'ET'
        }

        // Adobe Acrobat requires a /Resources dict on the signature appearance
        // XObject even when empty — otherwise it throws "Expected a dict
        // object" during signature verification.
        const resources =
            (lines.length > 0 ? this.buildFontResources('Helv') : undefined) ??
            new PdfDictionary()

        const appearance = new PdfAppearanceStream({
            width,
            height,
            contentStream,
            resources,
        })
        this.appearanceStream = appearance
        if (!this.print) this.print = true
        return true
    }
}
