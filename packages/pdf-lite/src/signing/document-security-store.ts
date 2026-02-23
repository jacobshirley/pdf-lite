import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfDate } from '../core/objects/pdf-date.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfDocument } from '../pdf/pdf-document.js'
import { ByteArray } from '../types.js'
import { RevocationInfo } from './types.js'

/**
 * Indirect object containing a certificate stream.
 */
export class PdfCertObject extends PdfIndirectObject<PdfStream> {}

/**
 * Indirect object containing a CRL stream.
 */
export class PdfCrlObject extends PdfIndirectObject<PdfStream> {}

/**
 * Indirect object containing an OCSP response stream.
 */
export class PdfOcspObject extends PdfIndirectObject<PdfStream> {}

/**
 * Validation Related Information (VRI) dictionary.
 * Associates revocation data with specific certificate hashes.
 */
export type PdfVriObject = PdfIndirectObject<
    PdfDictionary<{
        [CertHash: string]: PdfDictionary<{
            Type?: PdfName<'VRI'>
            Cert?: PdfObjectReference
            OCSP?: PdfObjectReference
            CRL?: PdfObjectReference
            TU?: PdfDate
            TS?: PdfString
        }>
    }>
>

/**
 * Dictionary for the Document Security Store (DSS).
 * Contains arrays of certificates, CRLs, OCSPs, and VRI entries.
 */
export class PdfDocumentSecurityStoreDictionary extends PdfDictionary<{
    Type?: PdfName<'DSS'>
    VRI?: PdfObjectReference
    OCSPs?: PdfArray<PdfObjectReference>
    CRLs?: PdfArray<PdfObjectReference>
    Certs?: PdfArray<PdfObjectReference>
}> {}

/**
 * Document Security Store (DSS) object for PAdES LTV signatures.
 * Stores validation data (certificates, CRLs, OCSPs) for long-term validation.
 *
 * @example
 * ```typescript
 * const dss = new PdfDocumentSecurityStoreObject(document)
 * dss.addCert(certificateBytes)
 * dss.addCrl(crlBytes)
 * dss.addOcsp(ocspBytes)
 * ```
 */
export class PdfDocumentSecurityStoreObject extends PdfIndirectObject<PdfDocumentSecurityStoreDictionary> {
    /** Reference to the parent document. */
    private document: PdfDocument

    /**
     * Creates a new DSS object.
     *
     * @param document - The parent PDF document.
     * @param content - Optional pre-existing DSS dictionary.
     */
    constructor(
        document: PdfDocument,
        content?: PdfDocumentSecurityStoreDictionary,
    ) {
        super(content ?? new PdfDocumentSecurityStoreDictionary())
        this.document = document
    }

    /**
     * Adds an OCSP response to the DSS, avoiding duplicates.
     *
     * @param ocsp - The DER-encoded OCSP response.
     * @returns The created or existing OCSP object.
     */
    addOcsp(ocsp: ByteArray): PdfOcspObject {
        const newOcsp = new PdfStream(ocsp)
        let ocspArray = this.content.get('OCSPs')

        const currentOcsps = (ocspArray?.items ?? []).map((ref) => {
            return this.document.readObject(ref)
        }) as PdfIndirectObject<PdfStream>[]

        for (const existingOcsp of currentOcsps) {
            if (existingOcsp.content.equals(newOcsp)) {
                return existingOcsp as PdfOcspObject
            }
        }

        const ocspObject = new PdfOcspObject(newOcsp)
        this.document.add(ocspObject)

        if (!ocspArray) {
            ocspArray = new PdfArray<PdfObjectReference>([])
            this.content.set('OCSPs', ocspArray)
        }

        ocspArray.items.push(ocspObject.reference)

        return ocspObject
    }

    /**
     * Adds a CRL to the DSS, avoiding duplicates.
     *
     * @param crl - The DER-encoded CRL.
     * @returns The created or existing CRL object.
     */
    addCrl(crl: ByteArray): PdfCrlObject {
        let crlArray = this.content.get('CRLs')

        const currentCrls = (crlArray?.items ?? []).map((ref) => {
            return this.document.readObject(ref)
        }) as PdfIndirectObject<PdfStream>[]

        for (const existingCrl of currentCrls) {
            if (existingCrl.content.equals(new PdfStream(crl))) {
                return existingCrl as PdfCrlObject
            }
        }

        const crlObject = new PdfCrlObject(new PdfStream(crl))
        this.document.add(crlObject)

        if (!crlArray) {
            crlArray = new PdfArray<PdfObjectReference>([])
            this.content.set('CRLs', crlArray)
        }

        crlArray.items.push(crlObject.reference)

        return crlObject
    }

    /**
     * Adds a certificate to the DSS, avoiding duplicates.
     *
     * @param cert - The DER-encoded certificate.
     * @returns The created or existing certificate object.
     */
    addCert(cert: ByteArray): PdfCertObject {
        let certArray = this.content.get('Certs')

        const currentCerts = (certArray?.items ?? []).map((ref) => {
            return this.document.readObject(ref)
        }) as PdfIndirectObject<PdfStream>[]

        for (const existingCert of currentCerts) {
            if (existingCert.content.equals(new PdfStream(cert))) {
                return existingCert as PdfCertObject
            }
        }

        const certObject = new PdfCertObject(new PdfStream(cert))
        this.document.add(certObject)

        if (!certArray) {
            certArray = new PdfArray<PdfObjectReference>([])
            this.content.set('Certs', certArray)
        }

        certArray.items.push(certObject.reference)

        return certObject
    }

    /**
     * Adds revocation information (CRLs and OCSPs) to the DSS.
     *
     * @param revocationInfo - The revocation information to add.
     */
    addRevocationInfo(revocationInfo: RevocationInfo): void {
        for (const ocsp of revocationInfo.ocsps ?? []) {
            this.addOcsp(ocsp)
        }

        for (const crl of revocationInfo.crls ?? []) {
            this.addCrl(crl)
        }
    }

    /**
     * Checks if the DSS is empty (contains no certificates, CRLs, or OCSPs).
     *
     * @returns True if the DSS has no stored data.
     */
    isEmpty(): boolean {
        const certs = this.content.get('Certs')
        const crls = this.content.get('CRLs')
        const ocsps = this.content.get('OCSPs')

        return (
            (!certs || certs.items.length === 0) &&
            (!crls || crls.items.length === 0) &&
            (!ocsps || ocsps.items.length === 0)
        )
    }
}
