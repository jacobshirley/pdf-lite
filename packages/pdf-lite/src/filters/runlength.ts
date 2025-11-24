import { ByteArray, PdfFilter } from '../types.js'

// RunLength filter implementation for PDF
export function runLength(): PdfFilter {
    return {
        encode: (data: ByteArray) => {
            const out: number[] = []
            let i = 0
            while (i < data.length) {
                let runLength = 1
                while (
                    runLength < 128 &&
                    i + runLength < data.length &&
                    data[i] === data[i + runLength]
                ) {
                    runLength++
                }
                if (runLength > 1) {
                    out.push(257 - runLength)
                    out.push(data[i])
                    i += runLength
                } else {
                    let literalLength = 1
                    while (
                        literalLength < 128 &&
                        i + literalLength < data.length &&
                        (data[i + literalLength] !==
                            data[i + literalLength - 1] ||
                            literalLength === 1)
                    ) {
                        literalLength++
                    }
                    out.push(literalLength - 1)
                    for (let j = 0; j < literalLength; ++j) {
                        out.push(data[i + j])
                    }
                    i += literalLength
                }
            }
            out.push(128) // EOD
            return new Uint8Array(out)
        },
        decode: (data: ByteArray) => {
            const out: number[] = []
            let i = 0
            while (i < data.length) {
                const len = data[i++]
                if (len === 128) break // EOD
                if (len < 128) {
                    for (let j = 0; j < len + 1; ++j) {
                        out.push(data[i++])
                    }
                } else if (len > 128) {
                    const count = 257 - len
                    const value = data[i++]
                    for (let j = 0; j < count; ++j) {
                        out.push(value)
                    }
                }
            }
            return new Uint8Array(out)
        },
    }
}
