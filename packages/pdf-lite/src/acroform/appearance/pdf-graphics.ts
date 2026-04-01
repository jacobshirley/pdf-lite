import { encodePdfText } from '../../utils/encodePdfText.js'
import type { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'
import { PdfFont } from '../../fonts/pdf-font.js'
import {
    parseMarkdownSegments,
    type StyledSegment,
} from '../../utils/parse-markdown-segments.js'

/**
 * Resource names of font variants to use when rendering styled markdown segments.
 * When a variant is provided, the appearance stream switches fonts instead of
 * simulating bold/italic via stroke width or matrix shear.
 */
export interface FontVariantNames {
    bold?: string
    italic?: string
    boldItalic?: string
}

/**
 * Lightweight builder for PDF content streams.
 * Chains PDF operators via a fluent API and emits the final stream with build().
 * Enhanced with text measurement capabilities for layout calculations.
 */
export class PdfGraphics {
    private lines: string[] = []
    private resolvedFonts?: Map<string, PdfFont>
    private defaultAppearance?: PdfDefaultAppearance
    private fontVariantNames?: FontVariantNames

    constructor(options?: {
        resolvedFonts?: Map<string, PdfFont>
        defaultAppearance?: PdfDefaultAppearance
        fontVariantNames?: FontVariantNames
    }) {
        this.resolvedFonts = options?.resolvedFonts
        this.defaultAppearance = options?.defaultAppearance
        this.fontVariantNames = options?.fontVariantNames
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
        type StyledChar = {
            char: string
            bold: boolean
            italic: boolean
            strikethrough: boolean
        }
        const chars: StyledChar[] = []
        for (const seg of segments) {
            for (const char of seg.text) {
                chars.push({
                    char,
                    bold: seg.bold,
                    italic: seg.italic,
                    strikethrough: seg.strikethrough,
                })
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
            let curStrikethrough = false
            const lineLen = lines[lineIdx].replace(/\r/g, '').length

            for (let j = 0; j < lineLen && pos < chars.length; j++, pos++) {
                const { char, bold, italic, strikethrough } = chars[pos]
                if (curText === '') {
                    curText = char
                    curBold = bold
                    curItalic = italic
                    curStrikethrough = strikethrough
                } else if (
                    bold !== curBold ||
                    italic !== curItalic ||
                    strikethrough !== curStrikethrough
                ) {
                    lineSegs.push({
                        text: curText,
                        bold: curBold,
                        italic: curItalic,
                        strikethrough: curStrikethrough,
                    })
                    curText = char
                    curBold = bold
                    curItalic = italic
                    curStrikethrough = strikethrough
                } else {
                    curText += char
                }
            }
            if (curText)
                lineSegs.push({
                    text: curText,
                    bold: curBold,
                    italic: curItalic,
                    strikethrough: curStrikethrough,
                })
            result.push(lineSegs)
        }

        return result
    }

    /**
     * Returns the resource name of the best-matching font variant for the given
     * bold/italic flags, or undefined if no variant fonts are configured.
     */
    private resolveVariantFontName(
        bold: boolean,
        italic: boolean,
    ): string | undefined {
        if (bold && italic && this.fontVariantNames?.boldItalic)
            return this.fontVariantNames.boldItalic
        if (bold && this.fontVariantNames?.bold)
            return this.fontVariantNames.bold
        if (italic && this.fontVariantNames?.italic)
            return this.fontVariantNames.italic
        return undefined
    }

    /**
     * Measures text width using a specific font from resolvedFonts by resource
     * name, falling back to measureTextWidth (regular font) if not found.
     */
    measureTextWidthWithFont(
        text: string,
        fontName: string | undefined,
        fontSize: number,
    ): number {
        if (!fontName) return this.measureTextWidth(text, fontSize)
        const font = this.resolvedFonts?.get(fontName)
        if (!font) return this.measureTextWidth(text, fontSize)
        let width = 0
        for (const char of text) {
            const w = font.getCharacterWidth(char.charCodeAt(0), fontSize)
            width += w !== null ? w : fontSize * 0.6
        }
        return width
    }

    /**
     * Emits styled text segments into the current BT…ET block.
     * Returns an array of rects for any strikethrough segments so the caller
     * can draw the lines after closing the text object.
     */
    private showSegments(
        lineSegs: StyledSegment[],
        isUnicode: boolean,
        reverseEncodingMap: Map<string, number> | undefined,
        startX: number,
        startY: number,
        fontSize: number,
    ): { x: number; y: number; width: number }[] {
        const regularFontName = this.defaultAppearance!.fontName
        let x = startX
        const strikethroughRects: { x: number; y: number; width: number }[] = []

        for (const seg of lineSegs) {
            const variantName = this.resolveVariantFontName(
                seg.bold,
                seg.italic,
            )

            if (variantName) {
                // True font variant — switch font, no simulation needed
                const variantFont = this.resolvedFonts?.get(variantName)
                const segIsUnicode = variantFont?.isUnicode ?? isUnicode
                const segEncMap =
                    variantFont?.reverseEncodingMap ?? reverseEncodingMap

                this.raw(`1 0 0 1 ${x.toFixed(3)} ${startY.toFixed(3)} Tm`)
                this.raw(`/${variantName} ${fontSize} Tf`)
                this.raw(`0 Tr`)
                this.showText(seg.text, segIsUnicode, segEncMap)
                const segWidth = this.measureTextWidthWithFont(
                    seg.text,
                    variantName,
                    fontSize,
                )
                if (seg.strikethrough) {
                    strikethroughRects.push({ x, y: startY, width: segWidth })
                }
                x += segWidth
            } else {
                // Fallback simulation (no variant font provided)
                // Always restore regular font in case a variant was active
                this.raw(`/${regularFontName} ${fontSize} Tf`)
                const shear = seg.italic ? PdfGraphics.ITALIC_SHEAR : 0
                this.raw(
                    `1 0 ${shear} 1 ${x.toFixed(3)} ${startY.toFixed(3)} Tm`,
                )
                if (seg.bold) {
                    const sw = (
                        fontSize * PdfGraphics.BOLD_STROKE_RATIO
                    ).toFixed(3)
                    this.raw(`${sw} w 2 Tr`)
                } else {
                    this.raw(`0 Tr`)
                }
                this.showText(seg.text, isUnicode, reverseEncodingMap)
                const segWidth = this.measureTextWidth(seg.text, fontSize)
                if (seg.strikethrough) {
                    strikethroughRects.push({ x, y: startY, width: segWidth })
                }
                x += segWidth
            }
        }

        // Restore regular font and fill-only rendering mode
        this.raw(`/${regularFontName} ${fontSize} Tf`)
        this.raw(`0 Tr`)
        return strikethroughRects
    }

    /**
     * Parses a markdown string, renders the styled segments inside a BT…ET
     * block, then draws strikethrough lines (if any) as path operations after
     * the text object. Pass `multiline` to wrap across multiple lines.
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
        const allStrikethroughRects: { x: number; y: number; width: number }[] =
            []

        this.beginText()
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
                const rects = this.showSegments(
                    styledLines[i],
                    isUnicode,
                    reverseEncodingMap,
                    x,
                    y - i * multiline.lineHeight,
                    fontSize,
                )
                allStrikethroughRects.push(...rects)
            }
        } else {
            const rects = this.showSegments(
                segments,
                isUnicode,
                reverseEncodingMap,
                x,
                y,
                fontSize,
            )
            allStrikethroughRects.push(...rects)
        }
        this.endText()

        // Draw strikethrough lines outside the text object
        if (allStrikethroughRects.length > 0) {
            const lineY = fontSize * 0.35
            const lineWidth = Math.max(0.5, fontSize * 0.06)
            this.raw(`q`)
            this.raw(`${lineWidth.toFixed(3)} w`)
            for (const rect of allStrikethroughRects) {
                const sy = (rect.y + lineY).toFixed(3)
                this.raw(
                    `${rect.x.toFixed(3)} ${sy} m ${(rect.x + rect.width).toFixed(3)} ${sy} l S`,
                )
            }
            this.raw(`Q`)
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
     * When a bold font variant is configured, uses its metrics conservatively
     * to prevent bold glyphs from overflowing field bounds.
     */
    wrapTextToLines(
        text: string,
        maxWidth: number,
        fontSize?: number,
    ): string[] {
        if (!this.currentFont) {
            throw new Error('No font set - call setDefaultAppearance() first')
        }

        const boldFontName = this.fontVariantNames?.bold
        const size = fontSize ?? this.currentFont.size
        const measure = (t: string) =>
            boldFontName
                ? this.measureTextWidthWithFont(t, boldFontName, size)
                : this.measureTextWidth(t, fontSize)

        // Handle explicit line breaks first
        const paragraphs = text.split('\n')
        const wrappedLines: string[] = []

        for (const paragraph of paragraphs) {
            if (measure(paragraph) <= maxWidth) {
                wrappedLines.push(paragraph)
                continue
            }

            // Word wrapping needed
            const words = paragraph.split(' ')
            let currentLine = ''

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word

                if (measure(testLine) <= maxWidth) {
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

        const boldFontName = this.fontVariantNames?.bold
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
            return boldFontName
                ? this.measureTextWidthWithFont(text, boldFontName, size) <=
                      maxWidth
                : this.measureTextWidth(text, size) <= maxWidth
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
        const boldFontName = this.fontVariantNames?.bold
        const size = fontSize ?? this.currentFont?.size ?? 12
        const measure = (t: string) =>
            boldFontName
                ? this.measureTextWidthWithFont(t, boldFontName, size)
                : this.measureTextWidth(t, fontSize)

        const lines: string[] = []
        let currentLine = ''

        for (const char of word) {
            const testLine = currentLine + char

            if (measure(testLine) <= maxWidth) {
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
