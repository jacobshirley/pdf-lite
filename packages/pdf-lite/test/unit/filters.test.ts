import { describe, expect, it } from 'vitest'
import { flate } from '../../src/filters/flate.js'
import { ascii85 } from '../../src/filters/ascii85.js'
import { runLength } from '../../src/filters/runlength.js'
import { asciiHex } from '../../src/filters/asciihex.js'
import { lzw } from '../../src/filters/lzw.js'
import { stringToBytes } from '../../src/utils/stringToBytes.js'

function toText(data: Uint8Array) {
    return new TextDecoder().decode(data)
}

describe('PDF filters', () => {
    describe('FlateDecode', () => {
        it('should encode and decode', async () => {
            const text = 'Hello World'
            const filter = flate()
            const data = stringToBytes(text)
            const encoded = await filter.encode(data)
            const decoded = await filter.decode(encoded)
            expect(toText(decoded)).toEqual(text)
        })
    })

    describe('ASCII85', () => {
        it('should encode and decode', async () => {
            const text = 'Hello World!'
            const filter = ascii85()
            const data = stringToBytes(text)
            const encoded = await filter.encode(data)
            const decoded = await filter.decode(encoded)
            expect(toText(decoded)).toEqual(text)
        })
    })

    describe('RunLength', () => {
        it('should encode and decode', async () => {
            const text = 'AAABBBCCCCDDDDDEEEEEEEEEEEEEEFFFFF'
            const filter = runLength()
            const data = stringToBytes(text)
            const encoded = await filter.encode(data)
            const decoded = await filter.decode(encoded)
            expect(toText(decoded)).toEqual(text)
        })
    })

    describe('ASCIIHex', () => {
        it('should encode and decode', async () => {
            const text = 'Hello World!'
            const filter = asciiHex()
            const data = stringToBytes(text)
            const encoded = await filter.encode(data)
            const decoded = await filter.decode(encoded)
            expect(toText(decoded)).toEqual(text)
        })
    })

    describe('LZW', () => {
        it('should decode a simple PDF LZW stream', async () => {
            const text = 'Hello World!'
            const filter = lzw()
            const encoded = await filter.encode(stringToBytes(text))
            const decoded = await filter.decode(encoded)
            expect(toText(decoded)).toEqual(text)
        })
    })
})
