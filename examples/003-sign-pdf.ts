// PDF signature example

import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import {
    PdfAdbePkcsX509RsaSha1SignatureObject,
    PdfAdbePkcs7DetachedSignatureObject,
    PdfAdbePkcs7Sha1SignatureObject,
    PdfEtsiCadesDetachedSignatureObject,
    PdfEtsiRfc3161SignatureObject,
} from 'pdf-lite'
import { rsaSigningKeys } from '../packages/pdf-lite/test/unit/fixtures/rsa-2048/index'
import fs from 'fs/promises'

function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

function createPageWithSignatureField(
    contentStreamRef: PdfObjectReference,
    signatureAnnotRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    pageDict.set('Annots', new PdfArray([signatureAnnotRef]))

    return new PdfIndirectObject({ content: pageDict })
}

function createSignatureAnnotation(
    signatureRef: PdfObjectReference,
    appearanceStreamRef: PdfObjectReference,
    pageRef: PdfObjectReference,
    signatureName: string,
): PdfIndirectObject<PdfDictionary> {
    const signatureAnnotation = new PdfDictionary()
    signatureAnnotation.set('Type', new PdfName('Annot'))
    signatureAnnotation.set('Subtype', new PdfName('Widget'))
    signatureAnnotation.set('FT', new PdfName('Sig'))
    signatureAnnotation.set('T', new PdfString(signatureName))
    signatureAnnotation.set(
        'Rect',
        new PdfArray([
            new PdfNumber(135), // x1: Start after "Signature: " text (~72 + 63)
            new PdfNumber(640), // y1: Bottom of signature area (652 - 12)
            new PdfNumber(400), // x2: End of signature line
            new PdfNumber(665), // y2: Top of signature area (652 + 13)
        ]),
    )
    signatureAnnotation.set('F', new PdfNumber(4))
    signatureAnnotation.set('P', pageRef) // Reference to parent page
    signatureAnnotation.set('V', signatureRef)

    // Add appearance dictionary
    const appearanceDict = new PdfDictionary()
    appearanceDict.set('N', appearanceStreamRef)
    signatureAnnotation.set('AP', appearanceDict)

    return new PdfIndirectObject({ content: signatureAnnotation })
}

function createSignatureAppearance(): PdfIndirectObject<PdfStream> {
    // Create font for appearance
    const appearanceFont = new PdfDictionary()
    appearanceFont.set('Type', new PdfName('Font'))
    appearanceFont.set('Subtype', new PdfName('Type1'))
    appearanceFont.set('BaseFont', new PdfName('Helvetica'))

    const fontDict = new PdfDictionary()
    fontDict.set('F1', appearanceFont)

    const resourcesDict = new PdfDictionary()
    resourcesDict.set('Font', fontDict)

    // Create appearance stream header
    const appearanceHeader = new PdfDictionary()
    appearanceHeader.set('Type', new PdfName('XObject'))
    appearanceHeader.set('Subtype', new PdfName('Form'))
    appearanceHeader.set(
        'BBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(265), // Width: 400 - 135
            new PdfNumber(25), // Height: 665 - 640
        ]),
    )
    appearanceHeader.set('Resources', resourcesDict)

    // Create appearance stream for the signature
    return new PdfIndirectObject({
        content: new PdfStream({
            header: appearanceHeader,
            original:
                'BT /F1 10 Tf 5 14 Td (Digitally signed by: Jake Shirley) Tj ET',
        }),
    })
}

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream for first page
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})
document.add(contentStream)

// Create first page
const page1 = createPage(contentStream.reference)
page1.content.set('Resources', resources.reference)
document.add(page1)

// Array to hold all pages and signature objects
const allPages: PdfIndirectObject<PdfDictionary>[] = [page1]
const allSignatures: any[] = []
const signatureFields: PdfObjectReference[] = []

// Helper function to create a signature page
function createSignaturePage(
    signatureType: string,
    signatureObj: any,
    pageNumber: number,
) {
    const content = new PdfIndirectObject({
        content: new PdfStream({
            header: new PdfDictionary(),
            original: `BT /F1 12 Tf 72 712 Td (Signature Type: ${signatureType}) Tj 0 -60 Td (Signature: ________________________________) Tj ET`,
        }),
    })
    document.add(content)

    const appearance = createSignatureAppearance()
    document.add(appearance)

    // Create page first to get its reference
    const page = createPageWithSignatureField(
        content.reference,
        new PdfObjectReference(0, 0), // Temporary placeholder
    )
    page.content.set('Resources', resources.reference)
    document.add(page)

    // Now create annotation with page reference
    const annotation = createSignatureAnnotation(
        signatureObj.reference,
        appearance.reference,
        page.reference,
        `Signature${pageNumber}`,
    )
    document.add(annotation)

    // Update page's Annots array with actual annotation reference
    page.content.set('Annots', new PdfArray([annotation.reference]))

    signatureFields.push(annotation.reference)
    return page
}

// Page 2: Adobe PKCS7 Detached
const pkcs7DetachedSig = new PdfAdbePkcs7DetachedSignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'PKCS7 Detached Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(pkcs7DetachedSig)
allPages.push(createSignaturePage('Adobe PKCS7 Detached', pkcs7DetachedSig, 2))

// Page 3: Adobe PKCS7 SHA1
const pkcs7Sha1Sig = new PdfAdbePkcs7Sha1SignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'PKCS7 SHA1 Signature',
    contactInfo: 'test@test.com',
})
allSignatures.push(pkcs7Sha1Sig)
allPages.push(createSignaturePage('Adobe PKCS7 SHA1', pkcs7Sha1Sig, 3))

// Page 4: Adobe X509 RSA SHA1
const x509RsaSha1Sig = new PdfAdbePkcsX509RsaSha1SignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    additionalCertificates: [rsaSigningKeys.caCert],
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'X509 RSA SHA1 Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(x509RsaSha1Sig)
allPages.push(createSignaturePage('Adobe X509 RSA SHA1', x509RsaSha1Sig, 4))

// Page 5: ETSI CAdES Detached
const cadesDetachedSig = new PdfEtsiCadesDetachedSignatureObject({
    privateKey: rsaSigningKeys.privateKey,
    certificate: rsaSigningKeys.cert,
    issuerCertificate: rsaSigningKeys.caCert,
    name: 'Jake Shirley',
    location: 'Earth',
    reason: 'CAdES Detached Signature',
    contactInfo: 'test@test.com',
    revocationInfo: {
        crls: [rsaSigningKeys.caCrl],
        ocsps: [rsaSigningKeys.ocspResponse],
    },
})
allSignatures.push(cadesDetachedSig)
allPages.push(createSignaturePage('ETSI CAdES Detached', cadesDetachedSig, 5))

// Page 6: ETSI RFC3161 (Timestamp)
const rfc3161Sig = new PdfEtsiRfc3161SignatureObject({
    timeStampAuthority: {
        url: 'https://freetsa.org/tsr',
    },
})
allSignatures.push(rfc3161Sig)
allPages.push(createSignaturePage('ETSI RFC3161 Timestamp', rfc3161Sig, 6))

// Create pages collection with all pages
const pages = createPages(allPages)
// Set parent reference for all pages
allPages.forEach((page) => {
    page.content.set('Parent', pages.reference)
})
document.add(pages)

// Create catalog with AcroForm
const catalog = createCatalog(pages.reference)

// Add AcroForm to catalog with all signature fields
const acroForm = new PdfDictionary()
acroForm.set('Fields', new PdfArray(signatureFields))
acroForm.set('SigFlags', new PdfNumber(3))
const acroFormObj = new PdfIndirectObject({ content: acroForm })
document.add(acroFormObj)
catalog.content.set('AcroForm', acroFormObj.reference)

document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

// IMPORTANT: Add all signatures LAST - after all other objects
// This ensures the ByteRange is calculated correctly for each signature
allSignatures.forEach((sig) => {
    document.startNewRevision()
    document.add(sig)
})

await document.commit()

//console.log(document.toString())

await fs.writeFile('signed-output.pdf', document.toBytes())
