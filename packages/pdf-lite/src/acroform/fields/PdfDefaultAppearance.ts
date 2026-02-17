/**
 * Value object that parses and builds DA (Default Appearance) strings.
 * DA format: "/FontName FontSize Tf ColorOp"
 */
export class PdfDefaultAppearance {
    fontName: string
    fontSize: number
    colorOp: string

    constructor(fontName: string, fontSize: number, colorOp: string) {
        this.fontName = fontName
        this.fontSize = fontSize
        this.colorOp = colorOp
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

    toString(): string {
        return `/${this.fontName} ${this.fontSize} Tf ${this.colorOp}`
    }

    withFontSize(size: number): PdfDefaultAppearance {
        return new PdfDefaultAppearance(this.fontName, size, this.colorOp)
    }

    withFontName(name: string): PdfDefaultAppearance {
        return new PdfDefaultAppearance(name, this.fontSize, this.colorOp)
    }
}
