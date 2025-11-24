import { Certificate } from 'pki-lite/x509/Certificate'
import { PrivateKeyInfo } from 'pki-lite/keys/PrivateKeyInfo'
import { SubjectPublicKeyInfo } from 'pki-lite/keys/SubjectPublicKeyInfo'
import { AsymmetricEncryptionAlgorithmParams } from 'pki-lite/core/crypto/types'

export async function createSelfSignedCert(
    keyPair: {
        privateKey: Uint8Array<ArrayBuffer>
        publicKey: Uint8Array<ArrayBuffer>
    },
    encryption?: AsymmetricEncryptionAlgorithmParams,
): Promise<Uint8Array<ArrayBuffer>> {
    const certificate = await Certificate.createSelfSigned({
        subject: 'CN=Test Self-Signed Certificate, O=My Organization, C=US',
        validity: {
            notBefore: new Date(),
            notAfter: new Date(
                new Date().setFullYear(new Date().getFullYear() + 1),
            ),
        },
        privateKeyInfo: PrivateKeyInfo.fromDer(keyPair.privateKey),
        subjectPublicKeyInfo: SubjectPublicKeyInfo.fromDer(keyPair.publicKey),
        algorithm: encryption,
    })

    return certificate.toDer()
}
