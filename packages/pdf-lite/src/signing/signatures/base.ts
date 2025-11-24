import { stringToBytes } from '../../utils/stringToBytes'
import { padBytes } from '../../utils/padBytes'
import { PdfDictionary } from '../../core/objects/pdf-dictionary'
import {
    PdfSignatureDictionaryEntries,
    PdfSignatureSubType,
    RevocationInfo,
} from '../types'
import { bytesToHexBytes } from '../../utils/bytesToHexBytes'
import { PdfArray } from '../../core/objects/pdf-array'
import { PdfNumber } from '../../core/objects/pdf-number'
import { PdfHexadecimal } from '../../core/objects/pdf-hexadecimal'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object'
import { ByteArray } from '../../types'
import { PdfName } from '../../core/objects/pdf-name'
import { PdfString } from '../../core/objects/pdf-string'
import { PdfDate } from '../../core/objects/pdf-date'

const PLACEHOLDER_BYTES = stringToBytes('placeholder_signature_bytes')
const PADDING = 8192 * 4
const OFFSET_PADDING = 12
const PLACEHOLDER_HEX_BYTES = padBytes(
    bytesToHexBytes(PLACEHOLDER_BYTES),
    PADDING,
)

export class PdfSignatureDictionary extends PdfDictionary<PdfSignatureDictionaryEntries> {
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

export type PdfSignatureSignOptions = {
    date?: Date
    name?: string
    reason?: string
    contactInfo?: string
    location?: string
}

export abstract class PdfSignatureObject extends PdfIndirectObject<PdfSignatureDictionary> {
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

    abstract sign(options: {
        bytes: ByteArray
        embedRevocationInfo?: boolean
    }): Promise<{
        signedBytes: ByteArray
        revocationInfo?: RevocationInfo
    }>

    get signedHexadecimal(): PdfHexadecimal {
        const contents = this.content.get('Contents')
        if (!contents) {
            throw new Error('Signature dictionary is missing Contents entry')
        }

        return contents
    }

    get signedBytes(): ByteArray {
        return this.signedHexadecimal.bytes
    }

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

    insertOrder(): number {
        return PdfIndirectObject.MAX_ORDER_INDEX - 10
    }
}
