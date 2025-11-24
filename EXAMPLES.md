# PKI-Lite Examples

This directory contains example scripts demonstrating how to use the PKI-Lite library.

## PDF creation from scratch example

```typescript
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'

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

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.commit(font)

// Create resources with the font
const resources = createResources(font.reference)
document.commit(resources)

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})

// Create a page
const page = createPage(contentStream.reference)
// Add resources to the page
page.content.set('Resources', resources.reference)
document.commit(page)

// Create pages collection
const pages = createPages([page])
// Set parent reference for the page
page.content.set('Parent', pages.reference)
document.commit(pages)

// Create catalog
const catalog = createCatalog(pages.reference)
document.commit(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

document.commit(contentStream)
console.log(document.toString())
```

## PDF creation with encryption example

```typescript
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { V2SecurityHandler } from 'pdf-lite/security/handlers/v2'

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

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.commit(font)

// Create resources with the font
const resources = createResources(font.reference)
document.commit(resources)

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})

// Create a page
const page = createPage(contentStream.reference)
// Add resources to the page
page.content.set('Resources', resources.reference)
document.commit(page)

// Create pages collection
const pages = createPages([page])
// Set parent reference for the page
page.content.set('Parent', pages.reference)
document.commit(pages)

// Create catalog
const catalog = createCatalog(pages.reference)
document.commit(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

document.commit(contentStream)

document.securityHandler = new V2SecurityHandler({
    password: 'up',
    documentId: 'cafebabe',
    encryptMetadata: true,
})

await document.encrypt()

console.log(document.toString())
```

## PDF signature example

```typescript
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
```

## Incremental PDF update example

```typescript
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import fs from 'fs/promises'

// Helper functions for creating PDF objects
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

// Step 1: Create an initial PDF document
console.log('Step 1: Creating initial PDF document...')
const document = new PdfDocument()

const font = createFont()
document.commit(font)

const resources = createResources(font.reference)
document.commit(resources)

const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original:
            'BT /F1 24 Tf 100 700 Td (Original Document - Revision 1) Tj ET',
    }),
})

const page = createPage(contentStream.reference)
page.content.set('Resources', resources.reference)
document.commit(page)

const pages = createPages([page])
page.content.set('Parent', pages.reference)
document.commit(pages)

const catalog = createCatalog(pages.reference)
document.commit(catalog)

document.trailerDict.set('Root', catalog.reference)
document.commit(contentStream)

// Save the original PDF
const originalPdfPath = '/tmp/original.pdf'
await fs.writeFile(originalPdfPath, document.toBytes())
console.log(`Original PDF saved to: ${originalPdfPath}`)
console.log(`Original PDF has ${document.revisions.length} revision(s)`)

// Step 2: Load the PDF and perform an incremental update
console.log('\nStep 2: Loading PDF and performing incremental update...')

// Read the existing PDF
const existingPdfBytes = await fs.readFile(originalPdfPath)
const loadedDocument = await PdfDocument.fromBytes([existingPdfBytes])

// Lock existing revisions to enable incremental mode
// This ensures changes are added as new revisions instead of modifying existing ones
loadedDocument.setIncremental(true)

// Start a new revision for our changes
loadedDocument.startNewRevision()

// Create new content for the incremental update
// In a real scenario, this could be adding annotations, form fields, signatures, etc.
const newContentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original:
            'BT /F1 18 Tf 100 650 Td (This content was added in Revision 2) Tj ET',
    }),
})

// Add the new content to the document
await loadedDocument.commit(newContentStream)

// Save the incrementally updated PDF
const updatedPdfPath = '/tmp/incremental-update.pdf'
await fs.writeFile(updatedPdfPath, loadedDocument.toBytes())
console.log(`Incrementally updated PDF saved to: ${updatedPdfPath}`)
console.log(`Updated PDF has ${loadedDocument.revisions.length} revision(s)`)

// Step 3: Verify the incremental update preserved the original content
console.log('\nStep 3: Verifying incremental update...')

// Check file sizes to confirm incremental update (new file should be larger)
const originalStats = await fs.stat(originalPdfPath)
const updatedStats = await fs.stat(updatedPdfPath)

console.log(`Original PDF size: ${originalStats.size} bytes`)
console.log(`Updated PDF size: ${updatedStats.size} bytes`)
console.log(
    `Size difference: ${updatedStats.size - originalStats.size} bytes (new revision data)`,
)

// The updated PDF contains the original bytes plus the new revision
// This is the key feature of incremental updates - the original PDF is preserved
const updatedPdfBytes = await fs.readFile(updatedPdfPath)
const originalPdfBytesForComparison = await fs.readFile(originalPdfPath)

// Verify that the beginning of the updated PDF matches the original
const originalBytesMatch = updatedPdfBytes
    .slice(0, originalPdfBytesForComparison.length - 10) // Exclude the %%EOF marker area
    .toString()
    .includes(
        originalPdfBytesForComparison
            .slice(0, -10)
            .toString()
            .substring(0, 100),
    )

console.log(`Original content preserved: ${originalBytesMatch ? 'Yes' : 'No'}`)

// Step 4: Add another incremental revision
console.log('\nStep 4: Adding another incremental revision...')

const secondUpdate = await PdfDocument.fromBytes([updatedPdfBytes])
secondUpdate.setIncremental(true)
secondUpdate.startNewRevision()

const thirdRevisionContent = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original:
            'BT /F1 14 Tf 100 600 Td (Third revision - demonstrates multiple incremental updates) Tj ET',
    }),
})

await secondUpdate.commit(thirdRevisionContent)

const multiRevisionPdfPath = '/tmp/multi-revision.pdf'
await fs.writeFile(multiRevisionPdfPath, secondUpdate.toBytes())
console.log(`Multi-revision PDF saved to: ${multiRevisionPdfPath}`)
console.log(
    `Multi-revision PDF has ${secondUpdate.revisions.length} revision(s)`,
)

const multiRevisionStats = await fs.stat(multiRevisionPdfPath)
console.log(`Multi-revision PDF size: ${multiRevisionStats.size} bytes`)

console.log('\n=== Summary ===')
console.log('Incremental updates allow you to:')
console.log('1. Preserve the original PDF content (important for signatures)')
console.log('2. Add new content without modifying existing revisions')
console.log('3. Maintain a complete history of document changes')
console.log('4. Stack multiple revisions on top of each other')
```

## Modifying AcroForms example - Creating and filling PDF form fields

```typescript
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfBoolean } from 'pdf-lite/core/objects/pdf-boolean'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import fs from 'fs/promises'

// Helper function to create a basic page
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

// Helper function to create pages collection
function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

// Helper function to create catalog
function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

// Helper function to create font
function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

// Helper function to create resources
function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

// Helper function to create a text field widget annotation
function createTextField(
    fieldName: string,
    pageRef: PdfObjectReference,
    rect: [number, number, number, number],
    defaultValue: string = '',
): PdfIndirectObject<PdfDictionary> {
    const fieldDict = new PdfDictionary()
    // Annotation properties
    fieldDict.set('Type', new PdfName('Annot'))
    fieldDict.set('Subtype', new PdfName('Widget'))
    // Field type: Text
    fieldDict.set('FT', new PdfName('Tx'))
    // Field name
    fieldDict.set('T', new PdfString(fieldName))
    // Bounding rectangle [x1, y1, x2, y2]
    fieldDict.set(
        'Rect',
        new PdfArray([
            new PdfNumber(rect[0]),
            new PdfNumber(rect[1]),
            new PdfNumber(rect[2]),
            new PdfNumber(rect[3]),
        ]),
    )
    // Annotation flags (4 = print)
    fieldDict.set('F', new PdfNumber(4))
    // Parent page reference
    fieldDict.set('P', pageRef)
    // Default value (if any)
    if (defaultValue) {
        fieldDict.set('V', new PdfString(defaultValue))
        fieldDict.set('DV', new PdfString(defaultValue))
    }
    // Default appearance string (font and size)
    fieldDict.set('DA', new PdfString('/Helv 12 Tf 0 g'))

    return new PdfIndirectObject({ content: fieldDict })
}

// Helper function to create a checkbox field widget annotation
function createCheckboxField(
    fieldName: string,
    pageRef: PdfObjectReference,
    rect: [number, number, number, number],
    checked: boolean = false,
): PdfIndirectObject<PdfDictionary> {
    const fieldDict = new PdfDictionary()
    // Annotation properties
    fieldDict.set('Type', new PdfName('Annot'))
    fieldDict.set('Subtype', new PdfName('Widget'))
    // Field type: Button
    fieldDict.set('FT', new PdfName('Btn'))
    // Field name
    fieldDict.set('T', new PdfString(fieldName))
    // Bounding rectangle
    fieldDict.set(
        'Rect',
        new PdfArray([
            new PdfNumber(rect[0]),
            new PdfNumber(rect[1]),
            new PdfNumber(rect[2]),
            new PdfNumber(rect[3]),
        ]),
    )
    // Annotation flags (4 = print)
    fieldDict.set('F', new PdfNumber(4))
    // Parent page reference
    fieldDict.set('P', pageRef)
    // Value: /Yes for checked, /Off for unchecked
    fieldDict.set('V', new PdfName(checked ? 'Yes' : 'Off'))
    fieldDict.set('AS', new PdfName(checked ? 'Yes' : 'Off'))

    return new PdfIndirectObject({ content: fieldDict })
}

// ============================================
// PART 1: Create a PDF with form fields
// ============================================

const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream with form labels
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: `BT
/F1 18 Tf 72 720 Td (PDF Form Example) Tj
/F1 12 Tf 0 -40 Td (Name:) Tj
0 -30 Td (Email:) Tj
0 -30 Td (Phone:) Tj
0 -30 Td (Subscribe to newsletter:) Tj
ET`,
    }),
})
document.add(contentStream)

// Create page
const page = createPage(contentStream.reference)
page.content.set('Resources', resources.reference)
document.add(page)

// Create form fields
const nameField = createTextField('name', page.reference, [150, 665, 400, 685])
const emailField = createTextField(
    'email',
    page.reference,
    [150, 635, 400, 655],
)
const phoneField = createTextField(
    'phone',
    page.reference,
    [150, 605, 400, 625],
)
const subscribeField = createCheckboxField(
    'subscribe',
    page.reference,
    [200, 575, 215, 590],
)

document.add(nameField)
document.add(emailField)
document.add(phoneField)
document.add(subscribeField)

// Add annotations to page
page.content.set(
    'Annots',
    new PdfArray([
        nameField.reference,
        emailField.reference,
        phoneField.reference,
        subscribeField.reference,
    ]),
)

// Create pages collection
const pages = createPages([page])
page.content.set('Parent', pages.reference)
document.add(pages)

// Create catalog
const catalog = createCatalog(pages.reference)

// Create AcroForm with all fields
const acroForm = new PdfDictionary()
acroForm.set(
    'Fields',
    new PdfArray([
        nameField.reference,
        emailField.reference,
        phoneField.reference,
        subscribeField.reference,
    ]),
)
// NeedAppearances flag tells PDF readers to generate appearance streams
acroForm.set('NeedAppearances', new PdfBoolean(true))

// Default resources for the form (font)
const formResources = new PdfDictionary()
const formFontDict = new PdfDictionary()
const helveticaFont = new PdfDictionary()
helveticaFont.set('Type', new PdfName('Font'))
helveticaFont.set('Subtype', new PdfName('Type1'))
helveticaFont.set('BaseFont', new PdfName('Helvetica'))
formFontDict.set('Helv', helveticaFont)
formResources.set('Font', formFontDict)
acroForm.set('DR', formResources)

const acroFormObj = new PdfIndirectObject({ content: acroForm })
document.add(acroFormObj)
catalog.content.set('AcroForm', acroFormObj.reference)

document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

await document.commit()

// Save the empty form
// This demonstrates creating a blank form that users can fill in
await fs.writeFile('form-empty.pdf', document.toBytes())
console.log('Created form-empty.pdf with empty form fields')

// ============================================
// PART 2: Fill in the form fields
// ============================================
// This demonstrates how to programmatically fill in form fields.
// We're continuing to use the same document object here, but in a
// real-world scenario, you would typically:
// 1. Read an existing PDF with PdfDocument.fromBytes()
// 2. Find the form fields in the AcroForm dictionary
// 3. Update the field values
// 4. Save the modified PDF

// Update the name field value
nameField.content.set('V', new PdfString('John Doe'))

// Update the email field value
emailField.content.set('V', new PdfString('john.doe@example.com'))

// Update the phone field value
phoneField.content.set('V', new PdfString('+1 (555) 123-4567'))

// Check the subscribe checkbox
subscribeField.content.set('V', new PdfName('Yes'))
subscribeField.content.set('AS', new PdfName('Yes'))

// Commit the changes
await document.commit()

// Save the filled form
await fs.writeFile('form-filled.pdf', document.toBytes())
console.log('Created form-filled.pdf with filled form fields')

console.log('\nForm field values:')
console.log('- Name: John Doe')
console.log('- Email: john.doe@example.com')
console.log('- Phone: +1 (555) 123-4567')
console.log('- Subscribe: Yes')
```
