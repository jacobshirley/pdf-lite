/**
 * Content stream parser for extracting text operators and positions from PDF content streams.
 * Parses PDF text showing operators (BT/ET blocks) and calculates bounding boxes.
 */

import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfFont } from '../fonts/pdf-font.js'
import { PdfStream } from '../core/objects/pdf-stream.js'

export interface TextSegment {
    text: string
    x: number
    y: number
    fontSize: number
    fontName: string
    /** End x position if known from content stream processing */
    endX?: number
}

export interface TextBlock {
    segments: TextSegment[]
    bbox: {
        x: number
        y: number
        width: number
        height: number
    }
}

export interface GraphicLine {
    bbox: {
        x: number
        y: number
        width: number
        height: number
    }
}

interface GraphicsState {
    fontSize: number
    fontName: string
    // Text matrix - current rendering position (advanced by Tj/TJ)
    tm: {
        x: number
        y: number
        scaleX: number
        scaleY: number
    }
    // Text line matrix - start of current line (set by Tm, Td, TD, T*)
    // Td/TD offset from this position, not from tm
    // Scale factors are needed because Td offsets are in text-space (multiplied by scale)
    tlm: {
        x: number
        y: number
        scaleX: number
        scaleY: number
    }
    // Character spacing (Tc operator) - extra space added after each character glyph
    charSpacing: number
    // Word spacing (Tw operator) - extra space added after space characters (code 32)
    wordSpacing: number
    // Current Transformation Matrix [a, b, c, d, e, f]
    // Transforms user space to page space: page_x = a*x + c*y + e, page_y = b*x + d*y + f
    ctm: [number, number, number, number, number, number]
}

/**
 * Multiply two 6-element PDF transformation matrices.
 * Matrix [a, b, c, d, e, f] represents:
 *   | a b 0 |
 *   | c d 0 |
 *   | e f 1 |
 * Result = m1 × m2 (m1 applied first, then m2)
 */
function multiplyMatrix(
    m1: [number, number, number, number, number, number],
    m2: [number, number, number, number, number, number],
): [number, number, number, number, number, number] {
    return [
        m1[0] * m2[0] + m1[1] * m2[2],
        m1[0] * m2[1] + m1[1] * m2[3],
        m1[2] * m2[0] + m1[3] * m2[2],
        m1[2] * m2[1] + m1[3] * m2[3],
        m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
        m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
    ]
}

/**
 * Transform a point (x, y) through a CTM to get page-space coordinates.
 */
function transformPoint(
    x: number,
    y: number,
    ctm: [number, number, number, number, number, number],
): { x: number; y: number } {
    return {
        x: ctm[0] * x + ctm[2] * y + ctm[4],
        y: ctm[1] * x + ctm[3] * y + ctm[5],
    }
}

/**
 * Parse N numeric operands preceding position `i` in the token array.
 * Returns them in forward order (operand at i-count first, operand at i-1 last),
 * or null if any operand is not a valid number.
 */
function parseNumericOperands(
    tokens: string[],
    i: number,
    count: number,
): number[] | null {
    const result: number[] = []
    for (let j = count; j >= 1; j--) {
        const v = parseFloat(tokens[i - j])
        if (isNaN(v)) return null
        result.push(v)
    }
    return result
}

/**
 * Parse a ToUnicode CMap stream to build a mapping from CID to Unicode string.
 */
function parseToUnicodeCMap(cmapContent: string): Map<number, string> {
    const map = new Map<number, string>()

    // Parse beginbfchar...endbfchar sections
    const bfcharRegex = /beginbfchar\s*([\s\S]*?)endbfchar/g
    let match
    while ((match = bfcharRegex.exec(cmapContent)) !== null) {
        const section = match[1]
        const lineRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
        let lineMatch
        while ((lineMatch = lineRegex.exec(section)) !== null) {
            const cid = parseInt(lineMatch[1], 16)
            const unicode = lineMatch[2]
            // Convert hex unicode to string (may be multi-char for surrogate pairs)
            let str = ''
            for (let j = 0; j < unicode.length; j += 4) {
                str += String.fromCharCode(
                    parseInt(unicode.substring(j, j + 4), 16),
                )
            }
            map.set(cid, str)
        }
    }

    // Parse beginbfrange...endbfrange sections
    const bfrangeRegex = /beginbfrange\s*([\s\S]*?)endbfrange/g
    while ((match = bfrangeRegex.exec(cmapContent)) !== null) {
        const section = match[1]
        const rangeRegex =
            /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
        let rangeMatch
        while ((rangeMatch = rangeRegex.exec(section)) !== null) {
            const start = parseInt(rangeMatch[1], 16)
            const end = parseInt(rangeMatch[2], 16)
            let unicodeStart = parseInt(rangeMatch[3], 16)
            for (let cid = start; cid <= end; cid++) {
                map.set(cid, String.fromCharCode(unicodeStart++))
            }
        }
    }

    return map
}

/**
 * Parse a PDF content stream and extract text blocks with their positions.
 *
 * @param contentString The decoded content stream as a string
 * @param options Optional resources and font dictionary for accurate text width calculations
 * @returns Array of text blocks with bounding boxes
 */
export function parseContentStreamForText(
    contentString: string,
    options?: {
        resources?: PdfDictionary | null
        fontDict?: PdfDictionary | PdfObjectReference | null
    },
): TextBlock[] {
    const textBlocks: TextBlock[] = []
    let currentBlock: TextSegment[] | null = null
    let currentState: GraphicsState = {
        fontSize: 12,
        fontName: 'Unknown',
        tm: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        tlm: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        charSpacing: 0,
        wordSpacing: 0,
        ctm: [1, 0, 0, 1, 0, 0],
    }
    const stateStack: GraphicsState[] = []
    let blockCtm: [number, number, number, number, number, number] = [
        1, 0, 0, 1, 0, 0,
    ]

    // Resolve fonts from resources if available
    const resolvedFonts = new Map<string, PdfFont>()
    if (options?.fontDict) {
        try {
            const fontDict =
                options.fontDict instanceof PdfObjectReference
                    ? options.fontDict.resolve()?.content
                    : options.fontDict

            if (fontDict instanceof PdfDictionary) {
                for (const [name, value] of fontDict.entries()) {
                    if (value instanceof PdfObjectReference) {
                        const fontObj = value.resolve()
                        if (fontObj?.content instanceof PdfDictionary) {
                            resolvedFonts.set(name, new PdfFont(fontObj as any))
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to resolve fonts from resources:', error)
        }
    }

    // Build ToUnicode maps for fonts that have them
    const toUnicodeMaps = new Map<string, Map<number, string>>()
    for (const [name, font] of resolvedFonts.entries()) {
        try {
            const toUnicodeRef = font.content.get('ToUnicode')
            if (toUnicodeRef) {
                const resolved =
                    toUnicodeRef instanceof PdfObjectReference
                        ? toUnicodeRef.resolve()?.content
                        : toUnicodeRef
                if (resolved instanceof PdfStream) {
                    const cmapContent = resolved.dataAsString
                    const umap = parseToUnicodeCMap(cmapContent)
                    if (umap.size > 0) {
                        toUnicodeMaps.set(name, umap)
                    }
                }
            }
        } catch {
            // Skip fonts without valid ToUnicode
        }
    }

    // Resolve XObjects from resources if available
    const resolvedXObjects = new Map<string, PdfStream>()
    if (options?.resources) {
        try {
            const resources =
                options.resources instanceof PdfObjectReference
                    ? options.resources.resolve()?.content
                    : options.resources

            if (resources instanceof PdfDictionary) {
                const xobjectDict = resources.get('XObject')
                const xobjectDictResolved =
                    xobjectDict instanceof PdfObjectReference
                        ? xobjectDict.resolve()?.content
                        : xobjectDict

                if (xobjectDictResolved instanceof PdfDictionary) {
                    for (const [name, value] of xobjectDictResolved.entries()) {
                        if (value instanceof PdfObjectReference) {
                            const xobj = value.resolve()
                            if (xobj?.content instanceof PdfStream) {
                                resolvedXObjects.set(name, xobj.content)
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to resolve XObjects from resources:', error)
        }
    }

    // Tokenize the content stream
    const tokens = tokenizeContentStream(contentString)

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        // q - Save graphics state
        if (token === 'q') {
            stateStack.push({
                ...currentState,
                tm: { ...currentState.tm },
                tlm: { ...currentState.tlm },
                ctm: [...currentState.ctm],
            })
        }
        // Q - Restore graphics state
        else if (token === 'Q') {
            if (stateStack.length > 0) {
                currentState = stateStack.pop()!
            }
        }
        // cm - Concat transformation matrix: a b c d e f cm
        else if (token === 'cm') {
            const ops = parseNumericOperands(tokens, i, 6)
            if (ops) {
                const [a, b, c, d, e, f] = ops
                currentState.ctm = multiplyMatrix(
                    [a, b, c, d, e, f],
                    currentState.ctm,
                )
            }
        }
        // BT - Begin text
        else if (token === 'BT') {
            currentBlock = []
            currentState.tm = { x: 0, y: 0, scaleX: 1, scaleY: 1 }
            currentState.tlm = { x: 0, y: 0, scaleX: 1, scaleY: 1 }
            blockCtm = [...currentState.ctm] as [
                number,
                number,
                number,
                number,
                number,
                number,
            ]
        }
        // ET - End text
        else if (token === 'ET') {
            if (currentBlock && currentBlock.length > 0) {
                // Transform segments from user space to page space using the CTM
                const isIdentity =
                    blockCtm[0] === 1 &&
                    blockCtm[1] === 0 &&
                    blockCtm[2] === 0 &&
                    blockCtm[3] === 1 &&
                    blockCtm[4] === 0 &&
                    blockCtm[5] === 0
                if (!isIdentity) {
                    for (const seg of currentBlock) {
                        const origY = seg.y
                        const p = transformPoint(seg.x, origY, blockCtm)
                        seg.x = p.x
                        seg.y = p.y
                        if (seg.endX !== undefined) {
                            const pe = transformPoint(seg.endX, origY, blockCtm)
                            seg.endX = pe.x
                        }
                        // Scale fontSize by the CTM scale factor
                        const ctmScaleY = Math.sqrt(
                            blockCtm[1] * blockCtm[1] +
                                blockCtm[3] * blockCtm[3],
                        )
                        seg.fontSize = seg.fontSize * ctmScaleY
                    }
                }

                // Split the block by Y coordinate to separate lines
                const lineBlocks = splitBlockByYCoordinate(currentBlock)

                // Create a text block for each line
                for (const lineSegments of lineBlocks) {
                    // Split further by large horizontal gaps (e.g. form fields between text)
                    const horizontalGroups =
                        splitLineByHorizontalGap(lineSegments)
                    for (const group of horizontalGroups) {
                        // Consolidate adjacent segments BEFORE calculating bbox
                        const consolidatedSegments =
                            consolidateAdjacentSegments(group)
                        const bbox = calculateBoundingBox(
                            consolidatedSegments,
                            resolvedFonts,
                        )
                        textBlocks.push({
                            segments: consolidatedSegments,
                            bbox,
                        })
                    }
                }
            }
            currentBlock = null
        }
        // Tf - Set font and size (e.g., "/F1 12 Tf")
        else if (token === 'Tf') {
            const size = parseFloat(tokens[i - 1])
            const font = tokens[i - 2]
            if (!isNaN(size) && font) {
                currentState.fontSize = size
                currentState.fontName = font.replace(/^\//, '')
            }
        }
        // Tm - Set text matrix (e.g., "a b c d e f Tm" = "1 0 0 1 100 700 Tm")
        else if (token === 'Tm') {
            const ops = parseNumericOperands(tokens, i, 6)
            if (ops) {
                const [a, , , d, e, f] = ops
                currentState.tm = {
                    x: e,
                    y: f,
                    scaleX: a,
                    scaleY: d,
                }
                currentState.tlm = {
                    x: e,
                    y: f,
                    scaleX: a,
                    scaleY: d,
                }
            }
        }
        // Td - Move to start of next line, offset from start of CURRENT LINE (not current position)
        else if (token === 'Td') {
            const ops = parseNumericOperands(tokens, i, 2)
            if (ops) {
                const [dx, dy] = ops
                const newX = currentState.tlm.x + dx * currentState.tlm.scaleX
                const newY = currentState.tlm.y + dy * currentState.tlm.scaleY
                currentState.tm.x = newX
                currentState.tm.y = newY
                currentState.tlm.x = newX
                currentState.tlm.y = newY
            }
        }
        // TD - Move text position and set leading (same positioning as Td)
        else if (token === 'TD') {
            const ops = parseNumericOperands(tokens, i, 2)
            if (ops) {
                const [dx, dy] = ops
                const newX = currentState.tlm.x + dx * currentState.tlm.scaleX
                const newY = currentState.tlm.y + dy * currentState.tlm.scaleY
                currentState.tm.x = newX
                currentState.tm.y = newY
                currentState.tlm.x = newX
                currentState.tlm.y = newY
            }
        }
        // Tc - Set character spacing
        else if (token === 'Tc') {
            const ops = parseNumericOperands(tokens, i, 1)
            if (ops) {
                currentState.charSpacing = ops[0]
            }
        }
        // Tw - Set word spacing
        else if (token === 'Tw') {
            const ops = parseNumericOperands(tokens, i, 1)
            if (ops) {
                currentState.wordSpacing = ops[0]
            }
        }
        // Tj - Show text (e.g., "(Hello) Tj" or "<00410042> Tj")
        else if (token === 'Tj') {
            const textToken = tokens[i - 1]
            const text = extractTextFromToken(
                textToken,
                toUnicodeMaps.get(currentState.fontName),
            )
            if (currentBlock && text) {
                const scaledFontSize =
                    currentState.fontSize * Math.abs(currentState.tm.scaleY)
                const widthFontSize =
                    currentState.fontSize * Math.abs(currentState.tm.scaleX)
                const currentFont = resolvedFonts.get(currentState.fontName)
                const scaleX = Math.abs(currentState.tm.scaleX)

                const segmentStartX = currentState.tm.x
                let currentX = segmentStartX

                // Compute text width for endX and tm.x advancement
                for (const char of text) {
                    const charCode = char.charCodeAt(0)
                    let charAdvance: number
                    if (currentFont) {
                        const charWidth = currentFont.getCharacterWidth(
                            charCode,
                            widthFontSize,
                        )
                        charAdvance = charWidth ?? widthFontSize * 0.5
                    } else {
                        charAdvance = widthFontSize * 0.5
                    }
                    charAdvance += currentState.charSpacing * scaleX
                    if (charCode === 32) {
                        charAdvance += currentState.wordSpacing * scaleX
                    }
                    currentX += charAdvance
                }

                currentBlock.push({
                    text,
                    x: segmentStartX,
                    y: currentState.tm.y,
                    fontSize: scaledFontSize,
                    fontName: currentState.fontName,
                    endX: currentX,
                })

                // Advance text matrix
                currentState.tm.x = currentX
            }
        }
        // TJ - Show text array (e.g., "[(Hello) -50 (World)] TJ")
        else if (token === 'TJ') {
            const arrayToken = tokens[i - 1]
            const elements = parseTJArray(
                arrayToken,
                toUnicodeMaps.get(currentState.fontName),
            )

            if (currentBlock && elements.length > 0) {
                // Track current x position within this TJ operation
                let currentX = currentState.tm.x
                // Use scaleY for font height (stored in segment for bbox height calculation)
                const scaledFontSize =
                    currentState.fontSize * Math.abs(currentState.tm.scaleY)
                // Use scaleX for character width advancement (PDF spec: glyph displacement = w0*Tfs*Tm.a)
                const widthFontSize =
                    currentState.fontSize * Math.abs(currentState.tm.scaleX)
                const currentFont = resolvedFonts.get(currentState.fontName)
                const scaleX = Math.abs(currentState.tm.scaleX)

                for (const element of elements) {
                    if (element.type === 'text' && element.value) {
                        // Add text segment at current position
                        const segmentStartX = currentX

                        // Advance x by the width of the text + character/word spacing
                        for (const char of element.value) {
                            const charCode = char.charCodeAt(0)
                            let charAdvance: number
                            if (currentFont) {
                                const charWidth = currentFont.getCharacterWidth(
                                    charCode,
                                    widthFontSize,
                                )
                                charAdvance = charWidth ?? widthFontSize * 0.5
                            } else {
                                charAdvance = widthFontSize * 0.5
                            }
                            // Add character spacing (scaled by text matrix)
                            charAdvance += currentState.charSpacing * scaleX
                            // Add word spacing for space characters (code 32)
                            if (charCode === 32) {
                                charAdvance += currentState.wordSpacing * scaleX
                            }
                            currentX += charAdvance
                        }

                        // Now push the segment with computed endX
                        currentBlock.push({
                            text: element.value,
                            x: segmentStartX,
                            y: currentState.tm.y,
                            fontSize: scaledFontSize,
                            fontName: currentState.fontName,
                            endX: currentX,
                        })
                    } else if (element.type === 'spacing') {
                        // Apply spacing adjustment (in 1/1000 of font size)
                        // Negative values move right in PDF coordinate space
                        currentX -= (element.value * widthFontSize) / 1000
                    }
                }

                // Update text matrix x position for next operator
                currentState.tm.x = currentX
            }
        }
        // ' - Move to next line and show text (same as T* then Tj)
        else if (token === "'") {
            const textToken = tokens[i - 1]
            const text = extractTextFromToken(
                textToken,
                toUnicodeMaps.get(currentState.fontName),
            )
            // Simplified: just use current position (proper impl would handle leading)
            if (currentBlock && text) {
                currentBlock.push({
                    text,
                    x: currentState.tm.x,
                    y: currentState.tm.y,
                    // Apply text matrix scaling to font size
                    fontSize:
                        currentState.fontSize *
                        Math.abs(currentState.tm.scaleY),
                    fontName: currentState.fontName,
                })
            }
        }
        // Do - Invoke XObject (e.g., "/Fm1 Do")
        else if (token === 'Do') {
            const xobjectName = tokens[i - 1]?.replace(/^\//, '')
            if (xobjectName && resolvedXObjects.has(xobjectName)) {
                const xobject = resolvedXObjects.get(xobjectName)!
                try {
                    // Check if this is a Form XObject (Subtype /Form)
                    const subtype = xobject.header.get('Subtype')
                    const subtypeResolved =
                        subtype instanceof PdfObjectReference
                            ? subtype.resolve()?.content
                            : subtype

                    if (subtypeResolved?.toString() === '/Form') {
                        // Recursively parse the XObject's content stream
                        const xobjectContent = xobject.dataAsString
                        const xobjectResourcesEntry =
                            xobject.header.get('Resources')
                        const xobjectResources =
                            xobjectResourcesEntry instanceof PdfObjectReference
                                ? xobjectResourcesEntry.resolve()?.content
                                : xobjectResourcesEntry instanceof PdfDictionary
                                  ? xobjectResourcesEntry
                                  : null
                        const xobjectFontDict =
                            xobjectResources instanceof PdfDictionary
                                ? xobjectResources.get('Font')
                                : null

                        // Parse XObject content stream and merge text blocks
                        const xobjectBlocks = parseContentStreamForText(
                            xobjectContent,
                            {
                                resources: xobjectResources,
                                fontDict: xobjectFontDict,
                            },
                        )

                        // Add XObject text blocks to our results
                        for (const block of xobjectBlocks) {
                            textBlocks.push(block)
                        }
                    }
                } catch (error) {
                    console.warn(
                        `Failed to parse XObject ${xobjectName}:`,
                        error,
                    )
                }
            }
        }
    }

    // Filter out whitespace-only text blocks (single spaces, tabs, etc.)
    const nonWhitespaceBlocks = textBlocks.filter((block) => {
        const combinedText = block.segments.map((s) => s.text).join('')
        return combinedText.trim().length > 0
    })

    // Merge text blocks that are on the same line (similar Y coordinate)
    // This combines separate BT...ET blocks that are visually on the same line
    return mergeBlocksOnSameLine(nonWhitespaceBlocks, resolvedFonts)
}

/**
 * Split segments into separate groups based on Y coordinate.
 * Segments with similar Y values (within tolerance) are grouped together.
 */
function splitBlockByYCoordinate(segments: TextSegment[]): TextSegment[][] {
    if (segments.length === 0) return []

    const yTolerance = 1.0 // Points - segments within 1pt are considered same line
    const lines: TextSegment[][] = []

    for (const segment of segments) {
        // Find an existing line with similar Y
        const existingLine = lines.find((line) => {
            const lineY = line[0].y
            return Math.abs(lineY - segment.y) <= yTolerance
        })

        if (existingLine) {
            existingLine.push(segment)
        } else {
            // Start a new line
            lines.push([segment])
        }
    }

    return lines
}

/**
 * Split a line's segments into groups separated by large horizontal gaps.
 * This handles cases where a single BT...ET block contains text on both sides
 * of a form field or other large gap.
 */
function splitLineByHorizontalGap(
    segments: TextSegment[],
    gapThreshold: number = 30,
): TextSegment[][] {
    if (segments.length <= 1) return [segments]

    const groups: TextSegment[][] = [[segments[0]]]

    for (let i = 1; i < segments.length; i++) {
        const prev = segments[i - 1]
        const curr = segments[i]

        // Estimate where the previous segment ends
        const estimatedPrevEndX =
            prev.x + prev.text.length * prev.fontSize * 0.5
        const gap = curr.x - estimatedPrevEndX

        if (gap > gapThreshold) {
            // Large horizontal gap - start a new group
            groups.push([curr])
        } else {
            groups[groups.length - 1].push(curr)
        }
    }

    return groups
}

/**
 * Merge text blocks that appear on the same line (similar Y coordinate).
 * PDF often splits text on a single line into multiple BT...ET blocks.
 */
function mergeBlocksOnSameLine(
    blocks: TextBlock[],
    resolvedFonts: Map<string, PdfFont>,
): TextBlock[] {
    if (blocks.length === 0) return blocks

    // Group blocks by approximate Y coordinate (within 1.5 points tolerance)
    const lineGroups = new Map<number, TextBlock[]>()
    const yTolerance = 1.5 // Allow for slight vertical positioning variations in PDF text

    for (const block of blocks) {
        // Use the first segment's Y as the line identifier
        const y = block.segments[0]?.y ?? 0

        // Find existing line group with similar Y
        let found = false
        for (const [lineY, group] of lineGroups.entries()) {
            if (Math.abs(lineY - y) <= yTolerance) {
                group.push(block)
                found = true
                break
            }
        }

        if (!found) {
            lineGroups.set(y, [block])
        }
    }

    // Merge blocks within each line group, but keep them separate if far apart
    const merged: TextBlock[] = []

    for (const group of lineGroups.values()) {
        if (group.length === 1) {
            // Even single blocks should have their segments consolidated
            const consolidated = consolidateAdjacentSegments(group[0].segments)
            const bbox = calculateBoundingBox(consolidated, resolvedFonts)
            merged.push({
                segments: consolidated,
                bbox,
            })
        } else {
            // Sort by X coordinate (left to right)
            group.sort((a, b) => {
                const aX = a.segments[0]?.x ?? 0
                const bX = b.segments[0]?.x ?? 0
                return aX - bX
            })

            // Group blocks that are horizontally adjacent
            const horizontalGroups: TextBlock[][] = []
            for (const block of group) {
                const blockX = block.segments[0]?.x ?? 0
                const blockEndX = blockX + (block.bbox?.width ?? 0)

                // Find a horizontal group this block belongs to
                let foundGroup = false
                for (const hGroup of horizontalGroups) {
                    const lastBlock = hGroup[hGroup.length - 1]
                    const lastX = lastBlock.segments[0]?.x ?? 0
                    const lastEndX = lastX + (lastBlock.bbox?.width ?? 0)

                    // If blocks are close horizontally (within 30pt), group them
                    const gap = blockX - lastEndX
                    if (gap >= -2 && gap <= 30) {
                        hGroup.push(block)
                        foundGroup = true
                        break
                    }
                }

                if (!foundGroup) {
                    horizontalGroups.push([block])
                }
            }

            // Process each horizontal group separately
            for (const hGroup of horizontalGroups) {
                // Combine all segments from this horizontal group
                const allSegments = hGroup.flatMap((block) => block.segments)

                // Consolidate adjacent segments
                const consolidatedSegments =
                    consolidateAdjacentSegments(allSegments)

                // Recalculate bounding box
                const bbox = calculateBoundingBox(
                    consolidatedSegments,
                    resolvedFonts,
                )

                merged.push({
                    segments: consolidatedSegments,
                    bbox,
                })
            }
        }
    }

    return merged
}

/**
 * Consolidate adjacent text segments on the same line into single segments.
 * This combines fragments like ["V", "i", "a", " ", "R", "io"] into ["Via Rio"].
 */
function consolidateAdjacentSegments(segments: TextSegment[]): TextSegment[] {
    if (segments.length === 0) return segments

    // Do NOT sort segments - they are already in correct reading order from the content stream.
    // Sorting by X position scrambles text when character-level positioning is used.
    const consolidated: TextSegment[] = []

    for (const segment of segments) {
        const last = consolidated[consolidated.length - 1]

        if (last) {
            // Merge consecutive segments with the same font/size
            // (they come from the same TJ array or adjacent text operations)
            if (
                last.fontName === segment.fontName &&
                Math.abs(last.fontSize - segment.fontSize) < 0.1
            ) {
                // Merge into the previous segment, keep the latest endX
                last.text += segment.text
                if (segment.endX !== undefined) {
                    last.endX = segment.endX
                }
            } else {
                // Start a new consolidated segment
                consolidated.push({ ...segment })
            }
        } else {
            // First segment
            consolidated.push({ ...segment })
        }
    }

    return consolidated
}

/**
 * Tokenize a PDF content stream into operators and operands.
 */
export function tokenizeContentStream(content: string): string[] {
    const tokens: string[] = []
    let current = ''
    let inString = false
    let inArray = false
    let arrayDepth = 0
    let arrayContent = ''

    for (let i = 0; i < content.length; i++) {
        const char = content[i]
        const nextChar = content[i + 1]

        // Handle arrays
        if (char === '[') {
            if (!inString) {
                inArray = true
                arrayDepth++
                arrayContent = char
                continue
            }
        }

        if (inArray) {
            arrayContent += char
            if (char === '[' && !inString) arrayDepth++
            if (char === ']' && !inString) {
                arrayDepth--
                if (arrayDepth === 0) {
                    tokens.push(arrayContent)
                    arrayContent = ''
                    inArray = false
                }
            }
            if (char === '(') inString = true
            if (char === ')') inString = false
            continue
        }

        // Handle strings
        if (char === '(') {
            inString = true
            current = char
            continue
        }

        if (inString) {
            current += char
            if (char === ')' && content[i - 1] !== '\\') {
                inString = false
                tokens.push(current)
                current = ''
            }
            continue
        }

        // Handle hex strings <...>
        if (char === '<' && nextChar !== '<') {
            if (current) {
                tokens.push(current)
                current = ''
            }
            let hexStr = '<'
            i++
            while (i < content.length && content[i] !== '>') {
                hexStr += content[i]
                i++
            }
            hexStr += '>'
            tokens.push(hexStr)
            continue
        }

        // Handle regular tokens
        if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
            if (current) {
                tokens.push(current)
                current = ''
            }
        } else {
            current += char
        }
    }

    if (current) {
        tokens.push(current)
    }

    return tokens
}

/**
 * Decode a hex string token like "<00410042>" using a ToUnicode map.
 * Hex strings in PDF content streams encode CID values (typically 2 bytes per character).
 */
function decodeHexString(
    hex: string,
    toUnicodeMap?: Map<number, string>,
): string {
    // Remove < > and whitespace
    const cleaned = hex.replace(/[<>\s]/g, '')
    if (cleaned.length === 0) return ''

    // Determine byte width: 4 hex chars = 2-byte CID, 2 hex chars = 1-byte
    const byteWidth = cleaned.length % 4 === 0 ? 4 : 2
    let result = ''

    for (let j = 0; j < cleaned.length; j += byteWidth) {
        const cid = parseInt(cleaned.substring(j, j + byteWidth), 16)
        if (toUnicodeMap && toUnicodeMap.has(cid)) {
            result += toUnicodeMap.get(cid)!
        } else {
            // Fallback: treat as Unicode code point
            result += String.fromCharCode(cid)
        }
    }

    return result
}

/**
 * Extract text from a PDF string token like "(Hello World)" or "<00410042>"
 */
function extractTextFromToken(
    token: string,
    toUnicodeMap?: Map<number, string>,
): string {
    if (!token) return ''

    // Handle hex strings
    if (token.startsWith('<') && token.endsWith('>')) {
        return decodeHexString(token, toUnicodeMap)
    }

    // Remove surrounding parentheses
    if (token.startsWith('(') && token.endsWith(')')) {
        const inner = token.slice(1, -1)
        // Handle basic escape sequences
        return inner
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
    }

    return token
}

/**
 * Extract text from a PDF array token like "[(Hello) -50 (World)]"
 */
function extractTextFromArrayToken(token: string): string[] {
    if (!token || !token.startsWith('[') || !token.endsWith(']')) {
        return []
    }

    const inner = token.slice(1, -1)
    const parts: string[] = []
    let current = ''
    let inString = false

    for (let i = 0; i < inner.length; i++) {
        const char = inner[i]

        if (char === '(') {
            inString = true
            current = char
        } else if (inString) {
            current += char
            if (char === ')' && inner[i - 1] !== '\\') {
                inString = false
                parts.push(extractTextFromToken(current))
                current = ''
            }
        }
        // Skip numbers (kerning adjustments)
    }

    return parts
}

/**
 * Parse TJ array and return elements with text and spacing adjustments.
 * Format: [(text1) adjustment1 (text2) adjustment2 ...]
 * Adjustments are in 1/1000 of font size units.
 */
function parseTJArray(
    token: string,
    toUnicodeMap?: Map<number, string>,
): Array<{ type: 'text'; value: string } | { type: 'spacing'; value: number }> {
    if (!token || !token.startsWith('[') || !token.endsWith(']')) {
        return []
    }

    const inner = token.slice(1, -1).trim()
    const elements: Array<
        { type: 'text'; value: string } | { type: 'spacing'; value: number }
    > = []
    let i = 0

    while (i < inner.length) {
        // Skip whitespace
        while (i < inner.length && /\s/.test(inner[i])) {
            i++
        }
        if (i >= inner.length) break

        // Parse text string
        if (inner[i] === '(') {
            let text = '('
            i++
            let escaped = false
            while (i < inner.length) {
                const char = inner[i]
                text += char
                if (char === ')' && !escaped) {
                    i++
                    break
                }
                escaped = char === '\\' && !escaped
                i++
            }
            elements.push({ type: 'text', value: extractTextFromToken(text) })
        }
        // Parse hex string
        else if (inner[i] === '<') {
            let hexStr = '<'
            i++
            while (i < inner.length && inner[i] !== '>') {
                hexStr += inner[i]
                i++
            }
            if (i < inner.length) {
                hexStr += '>'
                i++
            }
            elements.push({
                type: 'text',
                value: decodeHexString(hexStr, toUnicodeMap),
            })
        }
        // Parse number (spacing adjustment)
        else if (/[-\d.]/.test(inner[i])) {
            let numStr = ''
            while (i < inner.length && /[-\d.]/.test(inner[i])) {
                numStr += inner[i]
                i++
            }
            const num = parseFloat(numStr)
            if (!isNaN(num)) {
                elements.push({ type: 'spacing', value: num })
            }
        } else {
            i++ // Skip unknown character
        }
    }

    return elements
}

/**
 * Calculate a bounding box for a group of text segments.
 * Uses actual font metrics when available, falls back to estimation.
 */
function calculateBoundingBox(
    segments: TextSegment[],
    resolvedFonts: Map<string, PdfFont>,
): {
    x: number
    y: number
    width: number
    height: number
} {
    if (segments.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const segment of segments) {
        const { x, y, fontSize, text, fontName } = segment

        // Height metrics (same for all segments)
        const descenderHeight = fontSize * 0.3
        const ascenderHeight = fontSize * 0.95
        minY = Math.min(minY, y - descenderHeight)
        maxY = Math.max(maxY, y + ascenderHeight)
        minX = Math.min(minX, x)

        // Width: use precise endX from content stream if available
        if (segment.endX !== undefined) {
            maxX = Math.max(maxX, segment.endX)
        } else {
            // Fall back to font metric estimation
            const font = resolvedFonts.get(fontName)
            let textWidth: number

            if (font && font.widths && font.firstChar !== undefined) {
                textWidth = 0
                for (const char of text) {
                    const charCode = char.charCodeAt(0)
                    const charWidth = font.getCharacterWidth(charCode, fontSize)
                    textWidth += charWidth !== null ? charWidth : fontSize * 0.6
                }
            } else {
                textWidth = 0
                for (const char of text) {
                    const charCode = char.charCodeAt(0)
                    const charWidth = PdfFont.HELVETICA.getCharacterWidth(
                        charCode,
                        fontSize,
                    )
                    textWidth += charWidth !== null ? charWidth : fontSize * 0.6
                }
            }

            const estimatedWidth = textWidth * 1.03
            maxX = Math.max(maxX, x + estimatedWidth)
        }
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    }
}

/**
 * Merge text segments that are at the same position.
 * PDF content streams often split text character-by-character at the same X,Y.
 */
function mergeSegmentsAtSamePosition(segments: TextSegment[]): TextSegment[] {
    if (segments.length <= 1) return segments

    const merged: TextSegment[] = []
    const positionTolerance = 0.1 // Points

    for (const segment of segments) {
        // Find existing segment at same position
        const existing = merged.find(
            (s) =>
                Math.abs(s.x - segment.x) < positionTolerance &&
                Math.abs(s.y - segment.y) < positionTolerance &&
                s.fontName === segment.fontName &&
                s.fontSize === segment.fontSize,
        )

        if (existing) {
            // Merge text into existing segment
            existing.text += segment.text
        } else {
            // Add new segment
            merged.push({ ...segment })
        }
    }

    return merged
}

/**
 * Parse a PDF content stream and extract graphic lines/rectangles.
 * Extracts paths drawn with `re` (rectangle) or `m`/`l` (move/line) operators
 * that are stroked or filled. Returns bounding boxes for each graphic element.
 *
 * @param contentString The decoded content stream as a string
 * @returns Array of graphic lines with bounding boxes
 */
export function parseContentStreamForGraphics(
    contentString: string,
): GraphicLine[] {
    const lines: GraphicLine[] = []
    const tokens = tokenizeContentStream(contentString)

    // Track current path segments
    let pathSegments: Array<{ x: number; y: number; w: number; h: number }> = []
    let currentX = 0
    let currentY = 0
    let ctm: [number, number, number, number, number, number] = [
        1, 0, 0, 1, 0, 0,
    ]
    const ctmStack: [number, number, number, number, number, number][] = []

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        // q - Save graphics state
        if (token === 'q') {
            ctmStack.push([...ctm])
        }
        // Q - Restore graphics state
        else if (token === 'Q') {
            if (ctmStack.length > 0) {
                ctm = ctmStack.pop()!
            }
        }
        // cm - Concat transformation matrix
        else if (token === 'cm') {
            const f = parseFloat(tokens[i - 1])
            const e = parseFloat(tokens[i - 2])
            const d = parseFloat(tokens[i - 3])
            const c = parseFloat(tokens[i - 4])
            const b = parseFloat(tokens[i - 5])
            const a = parseFloat(tokens[i - 6])
            if (
                !isNaN(a) &&
                !isNaN(b) &&
                !isNaN(c) &&
                !isNaN(d) &&
                !isNaN(e) &&
                !isNaN(f)
            ) {
                ctm = multiplyMatrix([a, b, c, d, e, f], ctm)
            }
        }
        // re - Rectangle path: x y width height re
        else if (token === 're') {
            const h = parseFloat(tokens[i - 1])
            const w = parseFloat(tokens[i - 2])
            const y = parseFloat(tokens[i - 3])
            const x = parseFloat(tokens[i - 4])
            if (!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h)) {
                pathSegments.push({ x, y, w, h })
            }
        }
        // m - Moveto: x y m
        else if (token === 'm') {
            const y = parseFloat(tokens[i - 1])
            const x = parseFloat(tokens[i - 2])
            if (!isNaN(x) && !isNaN(y)) {
                currentX = x
                currentY = y
            }
        }
        // l - Lineto: x y l
        else if (token === 'l') {
            const y = parseFloat(tokens[i - 1])
            const x = parseFloat(tokens[i - 2])
            if (!isNaN(x) && !isNaN(y)) {
                // Create a thin rectangle from the line segment
                const minX = Math.min(currentX, x)
                const maxX = Math.max(currentX, x)
                const minY = Math.min(currentY, y)
                const maxY = Math.max(currentY, y)
                const w = maxX - minX
                const h = maxY - minY
                // Ensure minimum thickness of 1pt for lines
                pathSegments.push({
                    x: minX,
                    y: minY,
                    w: w || 1,
                    h: h || 1,
                })
                currentX = x
                currentY = y
            }
        }
        // S, s, f, F, f*, B, B*, b, b* - Path painting operators
        else if (
            token === 'S' ||
            token === 's' ||
            token === 'f' ||
            token === 'F' ||
            token === 'f*' ||
            token === 'B' ||
            token === 'B*' ||
            token === 'b' ||
            token === 'b*'
        ) {
            const isIdentity =
                ctm[0] === 1 &&
                ctm[1] === 0 &&
                ctm[2] === 0 &&
                ctm[3] === 1 &&
                ctm[4] === 0 &&
                ctm[5] === 0

            for (const seg of pathSegments) {
                let x = seg.w < 0 ? seg.x + seg.w : seg.x
                let y = seg.h < 0 ? seg.y + seg.h : seg.y
                let w = Math.abs(seg.w)
                let h = Math.abs(seg.h)

                if (!isIdentity) {
                    // Transform the rectangle corners through CTM
                    const p1 = transformPoint(x, y, ctm)
                    const p2 = transformPoint(x + w, y + h, ctm)
                    const minX = Math.min(p1.x, p2.x)
                    const maxX = Math.max(p1.x, p2.x)
                    const minY = Math.min(p1.y, p2.y)
                    const maxY = Math.max(p1.y, p2.y)
                    x = minX
                    y = minY
                    w = maxX - minX
                    h = maxY - minY
                }

                // Only include paths with meaningful size (skip tiny dots)
                if (w >= 2 || h >= 2) {
                    lines.push({
                        bbox: { x, y, width: w, height: h },
                    })
                }
            }
            pathSegments = []
        }
        // n - End path without painting (clip or discard)
        else if (token === 'n') {
            pathSegments = []
        }
    }

    return lines
}
