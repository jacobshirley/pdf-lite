import { PdfString } from '../../core/objects/pdf-string.js'
import { encodeToPDFDocEncoding } from '../../utils/encodeToPDFDocEncoding.js'

/**
 * Value object that parses and builds DA (Default Appearance) strings.
 * DA format: "/FontName FontSize Tf ColorOp"
 *
 * Extends PdfString so it can be stored directly in dictionaries
 * without additional wrapping.
 */
export class PdfDefaultAppearance extends PdfString {
    private _fontName: string
    private _fontSize: number
    private _colorOp: string

    constructor(fontName: string, fontSize: number, colorOp: string) {
        super(`/${fontName} ${fontSize} Tf ${colorOp}`)
        this._fontName = fontName
        this._fontSize = fontSize
        this._colorOp = colorOp
    }

    get fontName(): string {
        return this._fontName
    }

    set fontName(name: string) {
        this._fontName = name
        this.syncRaw()
    }

    get fontSize(): number {
        return this._fontSize
    }

    set fontSize(size: number) {
        this._fontSize = size
        this.syncRaw()
    }

    get colorOp(): string {
        return this._colorOp
    }

    set colorOp(op: string) {
        this._colorOp = op
        this.syncRaw()
    }

    private syncRaw(): void {
        // DA strings are always ASCII, so simple PDFDocEncoding works
        this.raw = encodeToPDFDocEncoding(this.toString())
    }

    toString(): string {
        return `/${this._fontName} ${this._fontSize} Tf ${this._colorOp}`
    }

    static parse(da: string): PdfDefaultAppearance | null {
        const fontMatch = da.match(/\/(\w+)\s+([\d.]+)\s+Tf/)
        if (!fontMatch) return null

        const fontName = fontMatch[1]
        let fontSize = parseFloat(fontMatch[2])
        if (!fontSize || fontSize <= 0) {
            fontSize = 12
        }

        let colorOp = '0 g'
        const rgMatch = da.match(/([\d.]+\s+[\d.]+\s+[\d.]+)\s+rg/)
        const gMatch = da.match(/([\d.]+)\s+g/)
        if (rgMatch) {
            colorOp = `${rgMatch[1]} rg`
        } else if (gMatch) {
            colorOp = `${gMatch[1]} g`
        }

        return new PdfDefaultAppearance(fontName, fontSize, colorOp)
    }
}
