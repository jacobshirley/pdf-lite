import { PdfDictionary, PdfIndirectObject } from '../core'

/**
 * Common interface for all font parsers.
 */
export interface FontParser {
    getFontInfo(): TtfFontInfo
    getFontDescriptor(fontName?: string): FontDescriptor
    getCharWidths(firstChar: number, lastChar: number): number[]
}

/**
 * Parsed TrueType font information.
 */
export interface TtfFontInfo {
    fontFamily: string
    fontSubfamily: string
    fullName: string
    postScriptName: string
    unitsPerEm: number
    ascent: number
    descent: number
    lineGap: number
    capHeight: number
    xHeight: number
    stemV: number
    bbox: [number, number, number, number]
    isItalic: boolean
    isBold: boolean
    isFixedPitch: boolean
}

/**
 * Font descriptor for embedding fonts in PDF documents.
 */
export interface FontDescriptor {
    fontName: string
    fontFamily: string
    fontWeight: number
    flags: number
    fontBBox: [number, number, number, number]
    italicAngle: number
    ascent: number
    descent: number
    capHeight: number
    stemV: number
    firstChar?: number
    lastChar?: number
    widths?: number[]
}

export interface UnicodeFontDescriptor extends FontDescriptor {
    defaultWidth?: number
    cidWidths?: CIDWidth[]
    cidToGidMap?: 'Identity'
}

export type CIDWidth =
    | { cid: number; width: number }
    | { startCid: number; widths: number[] }

/**
 * Detects the font format from the file signature.
 */
export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2' | 'unknown'

/**
 * Represents a font that has been found in a PDF document.
 */
export interface EmbeddedFont {
    fontName: string
    fontRef: PdfIndirectObject<PdfDictionary>
    baseFont: string
    encoding?: string
}
