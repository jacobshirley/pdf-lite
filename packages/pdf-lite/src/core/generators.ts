import { ByteArray } from '../types'
import { stringToBytes } from '../utils/stringToBytes'
import { PdfDecoder } from './decoder'
import { PdfObject } from './objects/pdf-object'
import { PdfByteStreamTokeniser } from './tokeniser'

export function* bytesToPdfObjects(
    bytes: Iterable<ByteArray>,
): Generator<PdfObject> {
    const tokeniser = new PdfByteStreamTokeniser()
    const decoder = new PdfDecoder()

    for (const chunk of bytes) {
        tokeniser.feedBytes(chunk)

        for (const token of tokeniser.nextItems()) {
            decoder.feed(token)

            for (const obj of decoder.nextItems()) {
                yield obj
            }
        }
    }

    tokeniser.eof = true
    decoder.eof = true

    for (const token of tokeniser.nextItems()) {
        decoder.feed(token)
    }

    for (const obj of decoder.nextItems()) {
        yield obj
    }
}

export function* stringToPdfObjects(str: string): Generator<PdfObject> {
    const bytes = stringToBytes(str)
    yield* bytesToPdfObjects([bytes])
}

export function* pdfDecoder(
    input: Iterable<ByteArray>,
    options?: { ignoreWhitespace?: boolean },
) {
    const decoder = new PdfDecoder(options)
    const tokeniser = new PdfByteStreamTokeniser()

    for (const chunk of input) {
        for (const byte of chunk) {
            tokeniser.feed(byte)
        }

        for (const token of tokeniser.nextItems()) {
            decoder.feed(token)
        }

        yield* decoder.nextItems()
    }

    tokeniser.eof = true
    decoder.eof = true

    for (const token of tokeniser.nextItems()) {
        decoder.feed(token)
    }

    yield* decoder.nextItems()
}

export async function* pdfDecoderAsync(
    input: AsyncIterable<ByteArray> | Iterable<ByteArray>,
): AsyncGenerator<PdfObject> {
    const tokeniser = new PdfByteStreamTokeniser()
    const decoder = new PdfDecoder()

    for await (const chunk of input) {
        tokeniser.feedBytes(chunk)

        for (const token of tokeniser.nextItems()) {
            decoder.feed(token)

            for (const obj of decoder.nextItems()) {
                yield obj
            }
        }
    }

    tokeniser.eof = true
    decoder.eof = true

    for (const token of tokeniser.nextItems()) {
        decoder.feed(token)
    }

    for (const obj of decoder.nextItems()) {
        yield obj
    }
}
