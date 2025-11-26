import { ByteArray } from '../../types'
import { stringToBytes } from '../../utils/stringToBytes'
import { Ref } from '../ref'
import { PdfToken } from './token'

export class PdfNumberToken extends PdfToken {
    #value: Ref<number>
    padTo: number
    decimalPlaces: number
    isByteToken: boolean = false

    constructor(
        options:
            | {
                  value: number | ByteArray | PdfNumberToken | Ref<number>
                  padTo?: number
                  decimalPlaces?: number
                  isByteToken?: boolean
              }
            | number
            | ByteArray,
        padTo?: number,
        decimalPlaces?: number,
    ) {
        super()

        if (
            typeof options === 'number' ||
            options instanceof Uint8Array ||
            options instanceof Ref ||
            options instanceof PdfNumberToken
        ) {
            this.#value = PdfNumberToken.getValue(options)
            this.padTo = padTo ?? 0
            this.decimalPlaces = decimalPlaces ?? 0
            this.isByteToken = false
            return
        }

        this.#value = PdfNumberToken.getValue(options.value)
        this.padTo = options.padTo ?? 0

        this.decimalPlaces =
            options.decimalPlaces ??
            PdfNumberToken.getDecimalPlaces(options.value)
        this.isByteToken = options.isByteToken ?? false
    }

    toBytes(): ByteArray {
        return PdfNumberToken.toBytes(
            this.#value,
            this.padTo,
            this.decimalPlaces,
        )
    }

    get ref(): Ref<number> {
        return this.#value
    }

    set ref(newRef: Ref<number>) {
        this.#value = newRef
    }

    get value(): number {
        return this.#value.resolve()
    }

    set value(newValue: number) {
        this.#value.update(newValue)
    }

    static getValue(
        bytes: ByteArray | PdfNumberToken | number | Ref<number>,
    ): Ref<number> {
        if (bytes instanceof Ref) {
            return bytes
        }

        if (bytes instanceof PdfNumberToken) {
            return bytes.ref
        }

        if (typeof bytes === 'number') {
            return new Ref(bytes)
        }

        const str = new TextDecoder().decode(bytes)
        return new Ref(parseFloat(str))
    }

    static getPadding(
        bytes: ByteArray | PdfNumberToken | number | Ref<number>,
    ): number {
        if (bytes instanceof PdfNumberToken) {
            return bytes.padTo
        }

        if (bytes instanceof Ref) {
            bytes = PdfNumberToken.toBytes(bytes.resolve())
        }

        if (typeof bytes === 'number') {
            bytes = PdfNumberToken.toBytes(bytes)
        }

        let padding = 0
        while (bytes.length && bytes[0] === 0x30) {
            bytes = bytes.slice(1)
            padding++
        }

        return padding
    }

    static getDecimalPlaces(
        bytes: ByteArray | PdfNumberToken | number | Ref<number>,
    ): number {
        if (bytes instanceof PdfNumberToken) {
            return bytes.decimalPlaces
        }

        if (bytes instanceof Ref) {
            bytes = PdfNumberToken.toBytes(bytes.resolve())
        }

        if (typeof bytes === 'number') {
            bytes = PdfNumberToken.toBytes(bytes)
        }

        const str = new TextDecoder().decode(bytes)
        const match = str.match(/\.(\d+)/)

        if (match) {
            return match[1].length
        }

        return 0
    }

    static toBytes(
        value: number | PdfNumberToken | Ref<number> | ByteArray,
        padTo?: number,
        decimalPlaces?: number,
    ): ByteArray {
        if (value instanceof Uint8Array) {
            return value
        }

        if (value instanceof PdfNumberToken) {
            return value.toBytes()
        }

        const numberValue = value instanceof Ref ? value.resolve() : value

        const valueString = decimalPlaces
            ? numberValue.toFixed(decimalPlaces)
            : numberValue.toString()

        const tokenString = valueString.padStart(padTo ?? 0, '0')

        return stringToBytes(tokenString)
    }
}
