import { encodePdfText } from '../../utils/encodePdfText.js'
import type { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'
import { PdfFont } from '../../fonts/pdf-font.js'
import {
    parseMarkdownSegments,
    type StyledSegment,
} from '../../utils/parse-markdown-segments.js'

/**
 * Lightweight builder for PDF content streams.
 * Chains PDF operators via a fluent API and emits the final stream with build().
 * Enhanced with text measurement capabilities for layout calculations.
 */
export class PdfGraphics {
    private lines: string[] = []
    private resolvedFonts?: Map<string, PdfFont>
    private defaultAppearance?: PdfDefaultAppearance

    constructor(options?: {
        resolvedFonts?: Map<string, PdfFont>
        defaultAppearance?: PdfDefaultAppearance
    }) {
        this.resolvedFonts = options?.resolvedFonts
        this.defaultAppearance = options?.defaultAppearance
    }

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

    setDefaultAppearance(da: PdfDefaultAppearance): this {
        this.lines.push(da.toString())
        this.defaultAppearance = da

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

    showLiteralText(text: string): this {
        this.lines.push(`(${text}) Tj`)
        return this
    }

    beginMarkedContent(): this {
        this.lines.push('/Tx BMC')
        return this
    }

    endMarkedContent(): this {
        this.lines.push('EMC')
        return this
    }

    raw(op: string): this {
        this.lines.push(op)
        return this
    }

    setFillRGB(r: number, g: number, b: number): this {
        this.lines.push(`${r} ${g} ${b} rg`)
        return this
    }

    setFillGray(v: number): this {
        this.lines.push(`${v} g`)
        return this
    }

    setFont(name: string, size: number): this {
        this.lines.push(`/${name} ${size} Tf`)
        return this
    }

    movePath(x: number, y: number): this {
        this.lines.push(`${x} ${y} m`)
        return this
    }

    lineTo(x: number, y: number): this {
        this.lines.push(`${x} ${y} l`)
        return this
    }

    curveTo(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
    ): this {
        this.lines.push(`${x1} ${y1} ${x2} ${y2} ${x3} ${y3} c`)
        return this
    }

    fill(): this {
        this.lines.push('f')
        return this
    }

    stroke(): this {
        this.lines.push('S')
        return this
    }

    closePath(): this {
        this.lines.push('h')
        return this
    }

    // Italic shear: ≈ tan(15°), applied as the c component of the Tm matrix.
    static readonly ITALIC_SHEAR = 0.267
    // Bold stroke width as a fraction of font size (0.04 × 12pt = 0.48pt stroke).
    static readonly BOLD_STROKE_RATIO = 0.04

    /**
     * Re-attributes styled segments to wrapped lines by tracking character
     * positions in the flat plain-text. One whitespace character is consumed
     * at each line boundary (space from word-wrap or newline from paragraph).
     */
    private static splitSegmentsToLines(
        segments: StyledSegment[],
        lines: string[],
    ): StyledSegment[][] {
        type StyledChar = { char: string; bold: boolean; italic: boolean }
        const chars: StyledChar[] = []
        for (const seg of segments) {
            for (const char of seg.text) {
                chars.push({ char, bold: seg.bold, italic: seg.italic })
            }
        }

        const result: StyledSegment[][] = []
        let pos = 0

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            if (lineIdx > 0 && pos < chars.length) {
                const c = chars[pos].char
                if (c === ' ' || c === '\n' || c === '\r') pos++
            }

            const lineSegs: StyledSegment[] = []
            let curText = ''
            let curBold = false
            let curItalic = false
            const lineLen = lines[lineIdx].replace(/\r/g, '').length

            for (let j = 0; j < lineLen && pos < chars.length; j++, pos++) {
                const { char, bold, italic } = chars[pos]
                if (curText === '') {
                    curText = char
                    curBold = bold
                    curItalic = italic
                } else if (bold !== curBold || italic !== curItalic) {
                    lineSegs.push({
                        text: curText,
                        bold: curBold,
                        italic: curItalic,
                    })
                    curText = char
                    curBold = bold
                    curItalic = italic
                } else {
                    curText += char
                }
            }
            if (curText)
                lineSegs.push({
                    text: curText,
                    bold: curBold,
                    italic: curItalic,
                })
            result.push(lineSegs)
        }

        return result
    }

    /**
     * Emits styled text segments into the current BT…ET block using PDF
     * operator simulation: bold via Tr=2 (fill+stroke), italic via Tm shear.
     * Each segment is positioned with an absolute Tm so no prior Td is needed.
     */
    private showSegments(
        lineSegs: StyledSegment[],
        isUnicode: boolean,
        reverseEncodingMap: Map<string, number> | undefined,
        startX: number,
        startY: number,
        fontSize: number,
    ): this {
        let x = startX
        for (const seg of lineSegs) {
            const shear = seg.italic ? PdfGraphics.ITALIC_SHEAR : 0
            this.raw(`1 0 ${shear} 1 ${x.toFixed(3)} ${startY.toFixed(3)} Tm`)
            if (seg.bold) {
                const sw = (fontSize * PdfGraphics.BOLD_STROKE_RATIO).toFixed(3)
                this.raw(`${sw} w 2 Tr`)
            } else {
                this.raw(`0 Tr`)
            }
            this.showText(seg.text, isUnicode, reverseEncodingMap)
            x += this.measureTextWidth(seg.text)
        }
        this.raw(`0 Tr`)
        return this
    }

    /**
     * Parses a markdown string and renders the styled segments into the current
     * BT…ET block. Pass `multiline` to wrap across multiple lines.
     */
    showMarkdown(
        markdown: string,
        isUnicode: boolean,
        reverseEncodingMap: Map<string, number> | undefined,
        x: number,
        y: number,
        fontSize: number,
        multiline?: { availableWidth: number; lineHeight: number },
    ): this {
        const segments = parseMarkdownSegments(markdown)
        if (multiline) {
            const plainText = segments.map((s) => s.text).join('')
            const lines = this.wrapTextToLines(
                plainText,
                multiline.availableWidth,
            )
            const styledLines = PdfGraphics.splitSegmentsToLines(
                segments,
                lines,
            )
            for (let i = 0; i < styledLines.length; i++) {
                this.showSegments(
                    styledLines[i],
                    isUnicode,
                    reverseEncodingMap,
                    x,
                    y - i * multiline.lineHeight,
                    fontSize,
                )
            }
        } else {
            this.showSegments(
                segments,
                isUnicode,
                reverseEncodingMap,
                x,
                y,
                fontSize,
            )
        }
        return this
    }

    build(): string {
        return this.lines.join('\n') + '\n'
    }

    private get currentFont(): {
        fontObject: PdfFont | undefined
        size: number
    } | null {
        if (!this.defaultAppearance) {
            return null
        }

        const fontName = this.defaultAppearance.fontName
        const size = this.defaultAppearance.fontSize
        const fontObject = this.resolvedFonts?.get(fontName)

        return { fontObject, size }
    }

    /**
     * Calculate the width of text using the current font and size.
     */
    measureTextWidth(text: string, fontSize?: number): number {
        if (!this.currentFont) {
            throw new Error('No font set - call setDefaultAppearance() first')
        }

        const { fontObject, size: currentSize } = this.currentFont
        const size = fontSize ?? currentSize
        const fontName = this.defaultAppearance!.fontName

        const effectiveFontObject =
            fontObject ?? PdfFont.getStandardFont(fontName)

        if (
            effectiveFontObject?.widths &&
            effectiveFontObject.firstChar !== undefined
        ) {
            let width = 0
            for (const char of text) {
                const charCode = char.charCodeAt(0)
                const charWidth = effectiveFontObject.getCharacterWidth(
                    charCode,
                    size,
                )
                if (charWidth !== null) {
                    width += charWidth
                } else {
                    width += size * 0.6
                }
            }
            return width
        }

        // Unknown font — use Helvetica as best-effort approximation
        let width = 0
        for (const char of text) {
            const charWidth = PdfFont.HELVETICA.getCharacterWidth(
                char.charCodeAt(0),
                size,
            )
            width += charWidth !== null ? charWidth : size * 0.6
        }
        return width
    }

    /**
     * Wrap text to fit within the specified width, breaking at word boundaries.
     */
    wrapTextToLines(
        text: string,
        maxWidth: number,
        fontSize?: number,
    ): string[] {
        if (!this.currentFont) {
            throw new Error('No font set - call setDefaultAppearance() first')
        }

        // Handle explicit line breaks first
        const paragraphs = text.split('\n')
        const wrappedLines: string[] = []

        for (const paragraph of paragraphs) {
            if (this.measureTextWidth(paragraph, fontSize) <= maxWidth) {
                wrappedLines.push(paragraph)
                continue
            }

            // Word wrapping needed
            const words = paragraph.split(' ')
            let currentLine = ''

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word

                if (this.measureTextWidth(testLine, fontSize) <= maxWidth) {
                    currentLine = testLine
                } else {
                    if (currentLine) {
                        wrappedLines.push(currentLine)
                        currentLine = word
                    } else {
                        // Single word is too long, break it
                        const brokenLines = this.breakLongWord(
                            word,
                            maxWidth,
                            fontSize,
                        )
                        wrappedLines.push(...brokenLines.slice(0, -1))
                        currentLine = brokenLines[brokenLines.length - 1]
                    }
                }
            }

            if (currentLine) {
                wrappedLines.push(currentLine)
            }
        }

        return wrappedLines
    }

    /**
     * Calculate the minimum font size needed to fit text within given constraints.
     */
    calculateFittingFontSize(
        text: string,
        maxWidth: number,
        maxHeight?: number,
        lineHeight: number = 1.2,
    ): number {
        if (!this.currentFont) {
            throw new Error('No font set - call setDefaultAppearance() first')
        }

        const startSize = this.currentFont.size
        const minSize = 0.5

        const fits = (size: number): boolean => {
            if (maxHeight !== undefined) {
                // Wrapping mode: text is allowed to span multiple lines,
                // so only check that the wrapped result fits the box.
                const lines = this.wrapTextToLines(text, maxWidth, size)
                return lines.length * size * lineHeight <= maxHeight
            }
            // Single-line mode: text must fit within maxWidth.
            return this.measureTextWidth(text, size) <= maxWidth
        }

        if (fits(startSize)) return startSize
        if (!fits(minSize)) return minSize

        // Binary search on 0.5pt grid: lo fits, hi does not
        let lo = minSize
        let hi = startSize
        while (hi - lo > 0.5) {
            const mid = Math.round((lo + hi) / 2 / 0.5) * 0.5
            if (fits(mid)) lo = mid
            else hi = mid
        }
        return lo
    }

    private breakLongWord(
        word: string,
        maxWidth: number,
        fontSize?: number,
    ): string[] {
        const lines: string[] = []
        let currentLine = ''

        for (const char of word) {
            const testLine = currentLine + char

            if (this.measureTextWidth(testLine, fontSize) <= maxWidth) {
                currentLine = testLine
            } else {
                if (currentLine) {
                    lines.push(currentLine)
                }
                currentLine = char
            }
        }

        if (currentLine) {
            lines.push(currentLine)
        }

        return lines.length > 0 ? lines : [word]
    }
}
