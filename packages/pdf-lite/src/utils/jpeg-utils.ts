export function isJpeg(bytes: Uint8Array): boolean {
    return bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8
}

export function getJpegDimensions(bytes: Uint8Array): {
    width: number
    height: number
} {
    let offset = 2
    while (offset < bytes.length - 1) {
        if (bytes[offset] !== 0xff) break
        const marker = bytes[offset + 1]
        offset += 2
        if (
            marker >= 0xc0 &&
            marker <= 0xcf &&
            marker !== 0xc4 &&
            marker !== 0xc8 &&
            marker !== 0xcc
        ) {
            if (offset + 7 <= bytes.length) {
                const height = (bytes[offset + 3] << 8) | bytes[offset + 4]
                const width = (bytes[offset + 5] << 8) | bytes[offset + 6]
                return { width, height }
            }
        }
        if (offset + 2 > bytes.length) break
        const segmentLength = (bytes[offset] << 8) | bytes[offset + 1]
        offset += segmentLength
    }
    return { width: 100, height: 100 }
}
