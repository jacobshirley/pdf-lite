import { PdfCommentToken } from '../core/tokens/comment-token'
import { PdfHexadecimalToken } from '../core/tokens/hexadecimal-token'
import { PdfNameToken } from '../core/tokens/name-token'
import { PdfToken } from '../core/tokens/token'
import { PdfDocument } from '../pdf/pdf-document'
import { concatUint8Arrays } from '../utils/concatUint8Arrays'
import { PdfDocumentSecurityStoreObject } from './document-security-store'
import { PdfSignatureObject } from './signatures'
import {
    PdfSignatureVerificationResult,
    CertificateValidationOptions,
} from './types'
import { PdfNumber } from '../core/objects/pdf-number'

/**
 * Result of verifying all signatures in a document.
 */
export type PdfDocumentVerificationResult = {
    /** Whether all signatures in the document are valid. */
    valid: boolean
    /** Individual signature verification results. */
    signatures: {
        /** Index of the signature in the document. */
        index: number
        /** The signature object. */
        signature: PdfSignatureObject
        /** The verification result. */
        result: PdfSignatureVerificationResult
    }[]
}

/**
 * Handles digital signing operations for PDF documents.
 * Processes signature objects and optionally stores revocation information in the DSS.
 *
 * @example
 * ```typescript
 * const signer = new PdfSigner()
 * const signedDoc = await signer.sign(document)
 * ```
 */
export class PdfSigner {
    /** Whether to use the Document Security Store for revocation information. */
    useDocumentSecurityStore: boolean = true

    /**
     * Signs all signature objects in the document.
     * Computes byte ranges, generates signatures, and optionally adds revocation info to DSS.
     *
     * @param document - The PDF document to sign.
     * @returns The signed document.
     */
    async sign(document: PdfDocument): Promise<PdfDocument> {
        const signatures: PdfSignatureObject[] = [
            ...document.objects.filter((x) => x instanceof PdfSignatureObject),
        ]

        const dss = this.useDocumentSecurityStore
            ? (document.objects.find(
                  (x) => x instanceof PdfDocumentSecurityStoreObject,
              ) ?? new PdfDocumentSecurityStoreObject(document))
            : undefined

        for (let i = 0; i < signatures.length; i++) {
            const signature = signatures[i]
            const tokens = document.tokensWithObjects()
            const signableTokens: PdfToken[] = []

            let contentsOffset = 0
            let contentsLength = 0
            let byteCount = 0
            let seen = 0

            for (let j = 0; j < tokens.length; j++) {
                let { token, object } = tokens[j]

                if (!(object instanceof PdfSignatureObject)) {
                    signableTokens.push(token)
                } else if (
                    !(token instanceof PdfNameToken) ||
                    token.name !== 'Contents'
                ) {
                    signableTokens.push(token)
                } else {
                    while (token instanceof PdfHexadecimalToken === false) {
                        byteCount += token.byteLength
                        token = tokens[++j].token
                    }

                    const contentsToken = token

                    const tokenStr = contentsToken.toString()
                    const start = tokenStr.indexOf('<')

                    contentsOffset = byteCount + start
                    contentsLength = tokenStr.indexOf('>') - start + 1
                    seen++
                }

                byteCount += token.byteLength

                if (
                    seen === i + 1 &&
                    PdfCommentToken.isEofCommentToken(token)
                ) {
                    break
                }
            }

            const byteRange = [
                0,
                contentsOffset,
                contentsOffset + contentsLength,
                byteCount - (contentsOffset + contentsLength),
            ]
            signature.setByteRange(byteRange)

            const allBytes = document.toBytes()

            const toSign = concatUint8Arrays(
                allBytes.slice(byteRange[0], byteRange[1]),
                allBytes.slice(byteRange[2], byteRange[3] + byteRange[2]),
            )

            const { signedBytes, revocationInfo } = await signature.sign({
                bytes: toSign,
                embedRevocationInfo: !Boolean(dss),
            })

            signature.setSignedBytes(signedBytes)
            if (dss && revocationInfo) {
                await dss.addRevocationInfo(revocationInfo)
            }
        }

        if (dss && !dss.isEmpty()) {
            await document.setDocumentSecurityStore(dss)
        }

        return document
    }

    /**
     * Verifies all signatures in the document.
     * Searches for signature objects, computes their byte ranges, and verifies each one.
     *
     * @param document - The PDF document to verify.
     * @param options - Optional verification options.
     * @returns The verification result for all signatures.
     *
     * @example
     * ```typescript
     * const signer = new PdfSigner()
     * const result = await signer.verify(document)
     * if (result.valid) {
     *     console.log('All signatures are valid')
     * } else {
     *     result.signatures.forEach(sig => {
     *         if (!sig.result.valid) {
     *             console.log(`Signature ${sig.index} invalid:`, sig.result.reasons)
     *         }
     *     })
     * }
     * ```
     */
    async verify(
        document: PdfDocument,
        options?: {
            certificateValidation?: CertificateValidationOptions | boolean
        },
    ): Promise<PdfDocumentVerificationResult> {
        const signatures: PdfSignatureObject[] = [
            ...document.objects.filter((x) => x instanceof PdfSignatureObject),
        ]

        const results: PdfDocumentVerificationResult['signatures'] = []
        let allValid = true

        const documentBytes = document.toBytes()

        for (let i = 0; i < signatures.length; i++) {
            const signature = signatures[i]

            // Get the ByteRange from the signature dictionary
            const byteRangeEntry = signature.content.get('ByteRange')
            if (!byteRangeEntry) {
                results.push({
                    index: i,
                    signature,
                    result: {
                        valid: false,
                        reasons: ['Signature is missing ByteRange entry'],
                    },
                })
                allValid = false
                continue
            }

            // Extract the byte range values
            const byteRange = byteRangeEntry.items.map((item) => {
                if (item instanceof PdfNumber) {
                    return item.value
                }
                return 0
            })

            if (byteRange.length !== 4) {
                results.push({
                    index: i,
                    signature,
                    result: {
                        valid: false,
                        reasons: ['Invalid ByteRange format'],
                    },
                })
                allValid = false
                continue
            }

            // Compute the bytes that were signed (excluding the signature contents)
            const signedBytes = concatUint8Arrays(
                documentBytes.slice(byteRange[0], byteRange[0] + byteRange[1]),
                documentBytes.slice(byteRange[2], byteRange[2] + byteRange[3]),
            )

            // Verify the signature
            const result = await signature.verify({
                bytes: signedBytes,
                certificateValidation: options?.certificateValidation,
            })

            results.push({
                index: i,
                signature,
                result,
            })

            if (!result.valid) {
                allValid = false
            }
        }

        return {
            valid: allValid,
            signatures: results,
        }
    }
}
