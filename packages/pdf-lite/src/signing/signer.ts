import { PdfCommentToken } from '../core/tokens/comment-token'
import { PdfHexadecimalToken } from '../core/tokens/hexadecimal-token'
import { PdfNameToken } from '../core/tokens/name-token'
import { PdfToken } from '../core/tokens/token'
import { PdfDocument } from '../pdf/pdf-document'
import { concatUint8Arrays } from '../utils/concatUint8Arrays'
import { PdfDocumentSecurityStoreObject } from './document-security-store'
import { PdfSignatureObject } from './signatures'

export class PdfSigner {
    useDocumentSecurityStore: boolean = true

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
}
