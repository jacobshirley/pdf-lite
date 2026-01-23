import { stringToBytes } from '../../utils/stringToBytes.js'
import { padBytes } from '../../utils/padBytes.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import {
    PdfSignatureDictionaryEntries,
    PdfSignatureSubType,
    PdfSignatureVerificationOptions,
    PdfSignatureVerificationResult,
    RevocationInfo,
} from '../types.js'
import { bytesToHexBytes } from '../../utils/bytesToHexBytes.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfHexadecimal } from '../../core/objects/pdf-hexadecimal.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { ByteArray } from '../../types.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfDate } from '../../core/objects/pdf-date.js'

const PLACEHOLDER_BYTES = stringToBytes('placeholder_signature_bytes')
const PADDING = 8192 * 4
const OFFSET_PADDING = 12
const PLACEHOLDER_HEX_BYTES = padBytes(
    bytesToHexBytes(PLACEHOLDER_BYTES),
    PADDING,
)

/**
 * PDF signature dictionary containing all signature-related entries.
 * Manages the ByteRange and Contents fields with appropriate placeholder sizing.
 */
export class PdfSignatureDictionary extends PdfDictionary<PdfSignatureDictionaryEntries> {
    /**
     * Creates a new signature dictionary.
     *
     * @param entries - The signature dictionary entries, ByteRange and Contents are auto-populated if not provided.
     */
    constructor(
        entries: Omit<
            PdfSignatureDictionaryEntries,
            'ByteRange' | 'Contents'
        > & {
            ByteRange?: PdfSignatureDictionaryEntries['ByteRange']
            Contents?: PdfSignatureDictionaryEntries['Contents']
        },
    ) {
        super({
            ...entries,
            ByteRange:
                entries.ByteRange ??
                new PdfArray([
                    new PdfNumber({ value: 0, padTo: OFFSET_PADDING }),
                    new PdfNumber({ value: 0, padTo: OFFSET_PADDING }),
                    new PdfNumber({ value: 0, padTo: OFFSET_PADDING }),
                    new PdfNumber({ value: 0, padTo: OFFSET_PADDING }),
                ]),
            Contents:
                entries.Contents ?? new PdfHexadecimal(PLACEHOLDER_HEX_BYTES),
        })
    }
}

/**
 * Options for signature metadata.
 */
export type PdfSignatureSignOptions = {
    /** Signing date. */
    date?: Date
    /** Signer name. */
    name?: string
    /** Reason for signing. */
    reason?: string
    /** Contact information. */
    contactInfo?: string
    /** Signing location. */
    location?: string
}

/**
 * Abstract base class for PDF signature objects.
 * Subclasses implement specific signature formats (PKCS#7, CAdES, etc.).
 *
 * @example
 * ```typescript
 * const signature = new PdfAdbePkcs7DetachedSignatureObject({
 *     privateKey,
 *     certificate,
 *     reason: 'Approval'
 * })
 * document.add(signature)
 * await document.commit()
 * ```
 */
export abstract class PdfSignatureObject extends PdfIndirectObject<PdfSignatureDictionary> {
    /**
     * Creates a new signature object.
     *
     * @param content - Either a signature dictionary or options to create one.
     */
    constructor(
        content:
            | PdfSignatureDictionary
            | (PdfSignatureSignOptions & {
                  subfilter: PdfSignatureSubType
                  certs?: ByteArray[]
              }),
    ) {
        super(
            content instanceof PdfSignatureDictionary
                ? content
                : new PdfSignatureDictionary({
                      Type: new PdfName('Sig'),
                      Filter: new PdfName('Adobe.PPKLite'),
                      SubFilter: new PdfName(content.subfilter),
                      Reason: content.reason
                          ? new PdfString(content.reason)
                          : undefined,
                      ContactInfo: content.contactInfo
                          ? new PdfString(content.contactInfo)
                          : undefined,
                      Location: content.location
                          ? new PdfString(content.location)
                          : undefined,
                      M: content.date ? new PdfDate(content.date) : undefined,
                      Name: content.name
                          ? new PdfString(content.name)
                          : undefined,
                      Cert: content.certs
                          ? new PdfArray(
                                content.certs.map(
                                    (cert) => new PdfHexadecimal(cert, 'bytes'),
                                ),
                            )
                          : undefined,
                  }),
        )
    }

    /**
     * Signs the document bytes and returns the signature.
     *
     * @param options - Signing options including bytes to sign.
     * @returns The signed bytes and optional revocation information.
     */
    abstract sign(options: {
        bytes: ByteArray
        embedRevocationInfo?: boolean
    }): Promise<{
        signedBytes: ByteArray
        revocationInfo?: RevocationInfo
    }>

    /**
     * Verifies the signature against the provided document bytes.
     *
     * @param options - Verification options including the signed bytes.
     * @returns The verification result.
     */
    abstract verify(
        options: PdfSignatureVerificationOptions,
    ): Promise<PdfSignatureVerificationResult>

    /**
     * Gets the signature hexadecimal content.
     *
     * @returns The Contents entry as hexadecimal.
     * @throws Error if Contents entry is missing.
     */
    get signedHexadecimal(): PdfHexadecimal {
        const contents = this.content.get('Contents')
        if (!contents) {
            throw new Error('Signature dictionary is missing Contents entry')
        }

        return contents
    }

    /**
     * Gets the raw signature bytes.
     *
     * @returns The signature bytes.
     */
    get signedBytes(): ByteArray {
        return this.signedHexadecimal.bytes
    }

    /**
     * Sets the signed bytes in the signature dictionary.
     *
     * @param signedBytes - The signature bytes to set.
     * @throws Error if Contents entry is missing.
     */
    setSignedBytes(signedBytes: ByteArray): void {
        const contents = this.content.get('Contents')
        if (!contents) {
            throw new Error('Signature dictionary is missing Contents entry')
        }

        const newHexadecimal = PdfHexadecimal.toHexadecimal(
            padBytes(signedBytes, contents.bytes.length),
        )

        this.content.set('Contents', newHexadecimal)
    }

    /**
     * Sets the byte range array for the signature.
     *
     * @param byteRange - Array of [offset1, length1, offset2, length2].
     * @throws Error if ByteRange entry is missing.
     */
    setByteRange(byteRange: number[]): void {
        const byteRangeEntry = this.content.get('ByteRange')
        if (!byteRangeEntry) {
            throw new Error('Signature dictionary is missing ByteRange entry')
        }

        this.content.set(
            'ByteRange',
            new PdfArray(
                byteRange.map(
                    (x) =>
                        new PdfNumber({
                            value: x,
                            padTo: OFFSET_PADDING,
                        }),
                ),
            ),
        )
    }

    /**
     * Gets the insertion order for this object in the PDF.
     *
     * @returns High order value to place signature near end of document.
     */
    order(): number {
        return PdfIndirectObject.MAX_ORDER_INDEX - 10
    }

    /**
     * Compares two byte arrays for equality.
     *
     * @param a - First byte array.
     * @param b - Second byte array.
     * @returns True if arrays are equal, false otherwise.
     */
    protected compareArrays(a: ByteArray, b: ByteArray): boolean {
        if (a.length !== b.length) {
            return false
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false
            }
        }
        return true
    }
}
