export type StyledSegment = {
    text: string
    bold: boolean
    italic: boolean
}

/**
 * Parses a markdown string with **bold**, *italic*, and ***bold+italic***
 * syntax into an array of styled text segments.
 *
 * Unrecognized or unmatched asterisks are emitted as plain text.
 */
export function parseMarkdownSegments(text: string): StyledSegment[] {
    const segments: StyledSegment[] = []
    // Match *** before ** before * to handle longest-match first
    const re = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|([^*]+|\*)/gs
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
        if (match[1] !== undefined) {
            segments.push({ text: match[1], bold: true, italic: true })
        } else if (match[2] !== undefined) {
            segments.push({ text: match[2], bold: true, italic: false })
        } else if (match[3] !== undefined) {
            segments.push({ text: match[3], bold: false, italic: true })
        } else if (match[4] !== undefined && match[4].length > 0) {
            segments.push({ text: match[4], bold: false, italic: false })
        }
    }
    return segments
}
