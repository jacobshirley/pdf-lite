import { ByteArray, PdfFilter } from '../types.js'
import { stringToBytes } from '../utils/stringToBytes.js'

// ASCII85 filter implementation
export function ascii85(): PdfFilter {
    return {
        encode: (data: ByteArray): ByteArray => {
            let result = ''
            let i = 0

            while (i < data.length) {
                // Read up to 4 bytes
                const chunk = new Array(4).fill(0)
                let chunkLen = 0
                for (; chunkLen < 4 && i < data.length; chunkLen++, i++) {
                    chunk[chunkLen] = data[i]
                }

                // Check for special case: 4 zero bytes encode to 'z'
                if (chunkLen === 4 && chunk.every((b) => b === 0)) {
                    result += 'z'
                    continue
                }

                // Convert 4 bytes to 32-bit value
                let value = 0
                for (let j = 0; j < 4; j++) {
                    value = (value << 8) | chunk[j]
                }

                // Convert to base 85
                const encoded = new Array(5)
                for (let j = 4; j >= 0; j--) {
                    encoded[j] = String.fromCharCode((value % 85) + 33)
                    value = Math.floor(value / 85)
                }

                // For incomplete groups, only output chunkLen + 1 characters
                result += encoded.slice(0, chunkLen + 1).join('')
            }

            return stringToBytes(result)
        },

        decode: (data: ByteArray): ByteArray => {
            let str = new TextDecoder().decode(data)

            // Remove delimiters if present
            str = str.replace(/^<~/, '').replace(/~>$/, '')

            // Remove whitespace
            str = str.replace(/\s/g, '')

            const out: number[] = []
            let i = 0

            while (i < str.length) {
                const char = str[i]

                // Handle special 'z' case (represents 4 zero bytes)
                if (char === 'z') {
                    out.push(0, 0, 0, 0)
                    i++
                    continue
                }

                // Read up to 5 characters
                const chunk = new Array(5).fill(84) // Fill with 'u' (84 + 33 = 117 = 'u')
                let chunkLen = 0

                for (
                    ;
                    chunkLen < 5 && i < str.length && str[i] !== 'z';
                    chunkLen++, i++
                ) {
                    const code = str.charCodeAt(i) - 33
                    if (code < 0 || code > 84) {
                        throw new Error(`Invalid ASCII85 character: ${str[i]}`)
                    }
                    chunk[chunkLen] = code
                }

                if (chunkLen === 0) break

                // Convert from base 85 to 32-bit value
                let value = 0
                for (let j = 0; j < 5; j++) {
                    value = value * 85 + chunk[j]
                }

                // Extract bytes (but only the ones we should have based on input length)
                const bytesToOutput = Math.min(4, chunkLen - 1)
                for (let j = 3; j >= 4 - bytesToOutput; j--) {
                    out.push((value >> (j * 8)) & 0xff)
                }
            }

            return new Uint8Array(out)
        },
    }
}
