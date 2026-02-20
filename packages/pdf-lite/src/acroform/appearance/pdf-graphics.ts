import { encodePdfText } from '../../utils/encodePdfText.js'
import type { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'

/**
 * Lightweight builder for PDF content streams.
 * Chains PDF operators via a fluent API and emits the final stream with build().
 */
export class PdfGraphics {
    private lines: string[] = []

    save(): this {
        this.lines.push('q')
        return this
    }

    restore(): this {
        this.lines.push('Q')
        return this
    }

    beginText(): this {
        this.lines.push('BT')
        return this
    }

    endText(): this {
        this.lines.push('ET')
        return this
    }

    setFont(da: PdfDefaultAppearance): this {
        this.lines.push(da.toString())
        return this
    }

    moveTo(x: number, y: number): this {
        this.lines.push(`${x} ${y} Td`)
        return this
    }

    showText(
        text: string,
        isUnicode: boolean,
        reverseEncodingMap?: Map<string, number>,
    ): this {
        this.lines.push(
            `${encodePdfText(text, isUnicode, reverseEncodingMap)} Tj`,
        )
        return this
    }

    raw(op: string): this {
        this.lines.push(op)
        return this
    }

    build(): string {
        return this.lines.join('\n') + '\n'
    }
}
