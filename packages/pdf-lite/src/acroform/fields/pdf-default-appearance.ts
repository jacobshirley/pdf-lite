import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { encodeToPDFDocEncoding } from '../../utils/encodeToPDFDocEncoding.js'
import { ContentOp } from '../../graphics/ops/base.js'
import { SetFontOp } from '../../graphics/ops/text.js'
import {
    SetFillColorCMYKOp,
    SetFillColorGrayOp,
    SetFillColorRGBOp,
} from '../../graphics/ops/color.js'

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
        super(`/${PdfName.escapeName(fontName)} ${fontSize} Tf ${colorOp}`)
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
        return `/${PdfName.escapeName(this._fontName)} ${this._fontSize} Tf ${this._colorOp}`
    }

    /**
     * Materialise this DA as a pair of typed content-stream ops:
     * `[SetFontOp, <fill-colour op>]`.  Callers that emit typed ops
     * directly should push these instead of the raw DA string.
     */
    toOps(): ContentOp[] {
        const fontOp = SetFontOp.create(this._fontName, this._fontSize)
        const co = this._colorOp.trim()
        const nums = co.split(/\s+/)
        const kind = nums.pop()
        const vals = nums.map(Number)
        let colorOp: ContentOp
        if (kind === 'rg' && vals.length === 3) {
            colorOp = SetFillColorRGBOp.create(vals[0], vals[1], vals[2])
        } else if (kind === 'g' && vals.length === 1) {
            colorOp = SetFillColorGrayOp.create(vals[0])
        } else if (kind === 'k' && vals.length === 4) {
            colorOp = SetFillColorCMYKOp.create(
                vals[0],
                vals[1],
                vals[2],
                vals[3],
            )
        } else {
            // Fallback: default to black gray.
            colorOp = SetFillColorGrayOp.create(0)
        }
        return [fontOp, colorOp]
    }

    static parse(da: string): PdfDefaultAppearance | null {
        const fontMatch = da.match(/\/([\S]+)\s+([\d.]+)\s+Tf/)
        if (!fontMatch) return null

        const fontName = PdfName.unescapeName(fontMatch[1])
        const fontSize = parseFloat(fontMatch[2]) || 0

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
