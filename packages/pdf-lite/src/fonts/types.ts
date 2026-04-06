import { PdfDictionary, PdfIndirectObject } from '../core'
import type { ByteArray } from '../types.js'
import type { PdfFontDescriptor } from './pdf-font-descriptor.js'

/**
 * Common interface for all font parsers.
 */
export interface FontParser {
    getFontInfo(): TtfFontInfo
    getPdfFontDescriptor(fontName?: string): PdfFontDescriptor
    getCharWidths(firstChar: number, lastChar: number): number[]
    getFontData(): ByteArray
    /**
     * Parses the font's cmap table to extract Unicode to glyph ID mappings.
     * @returns A map from Unicode code points to glyph IDs
     */
    parseCmap(): Map<number, number>
    /**
     * Parses the font's hmtx table to extract glyph advance widths.
     * @returns A map from glyph IDs to advance widths (in font units)
     */
    parseHmtx(): Map<number, number>
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

export type CIDWidth =
    | { cid: number; width: number }
    | { startCid: number; widths: number[] }

/**
 * Detects the font format from the file signature.
 */
export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2' | 'unknown'

export interface AfmBBox {
    llx: number
    lly: number
    urx: number
    ury: number
}

export interface AfmCharMetric {
    code: number
    wx: number
    name: string
    bbox: AfmBBox
    ligatures?: Record<string, string>
}

export interface AfmKernPair {
    left: string
    right: string
    dx: number
}

export interface AfmFont {
    metadata: Record<string, string | number | boolean>
    bbox: AfmBBox
    charMetrics: AfmCharMetric[]
    kernPairs: AfmKernPair[]
}
