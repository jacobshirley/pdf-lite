import { ByteArray } from '../types'
import { stringToBytes } from '../utils/stringToBytes'
import { PdfDecoder } from './decoder'
import { PdfObject } from './objects/pdf-object'
import { PdfByteStreamTokeniser } from './tokeniser'

/**
 * Converts an iterable of byte arrays into PDF objects.
 * Processes bytes through tokenization and decoding.
 *
 * @param bytes - Iterable of byte arrays to process
 * @returns A generator yielding parsed PDF objects
 */
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

/**
 * Converts a string containing PDF content into PDF objects.
 *
 * @param str - The string to parse as PDF content
 * @returns A generator yielding parsed PDF objects
 */
export function* stringToPdfObjects(str: string): Generator<PdfObject> {
    const bytes = stringToBytes(str)
    yield* bytesToPdfObjects([bytes])
}

/**
 * Decodes an iterable of byte arrays into PDF objects.
 * Allows configuring whitespace handling.
 *
 * @param input - Iterable of byte arrays to decode
 * @param options - Configuration options
 * @param options.ignoreWhitespace - If true, whitespace tokens are ignored
 * @returns A generator yielding parsed PDF objects
 */
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

/**
 * Asynchronously decodes byte arrays into PDF objects.
 * Supports both async and sync iterables for streaming PDF parsing.
 *
 * @param input - Async or sync iterable of byte arrays
 * @returns An async generator yielding parsed PDF objects
 */
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
