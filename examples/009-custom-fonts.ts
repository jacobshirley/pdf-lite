// Custom font embedding example
// Demonstrates how to embed TrueType fonts and use standard PDF fonts
// Shows PdfFont.fromBytes() which auto-detects TTF, OTF, and WOFF formats

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { PdfFont } from 'pdf-lite'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'

// Helper to create a page
function createPage(
    contentStreamRef: PdfIndirectObject<PdfStream>,
    resourcesRef: PdfIndirectObject<PdfDictionary>,
    pagesRef: PdfIndirectObject<PdfDictionary>,
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
    pageDict.set('Contents', contentStreamRef.reference)
    pageDict.set('Resources', resourcesRef.reference)
    pageDict.set('Parent', pagesRef.reference)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray([]))
    pagesDict.set('Count', new PdfNumber(0))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfIndirectObject<PdfDictionary>,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef.reference)
    return new PdfIndirectObject({ content: catalogDict })
}

async function main() {
    const document = new PdfDocument()

    // Create document structure
    const pages = createPages()
    const catalog = createCatalog(pages)

    document.add(pages, catalog)
    document.trailerDict.set('Root', catalog.reference)
    await document.commit()

    // Embed a standard font (built into all PDF readers)
    const helveticaBold =
        await document.fonts.embedStandardFont('Helvetica-Bold')
    const timesRoman = await document.fonts.embedStandardFont('Times-Roman')
    const courier = await document.fonts.embedStandardFont('Courier')

    console.log(
        `Embedded standard fonts: ${helveticaBold}, ${timesRoman}, ${courier}`,
    )

    // Embed custom TrueType font using PdfFont.fromBytes
    // This method auto-detects the font format (TTF, OTF, WOFF)
    const fontPath = `${import.meta.dirname}/tmp/Roboto-Regular.ttf`

    if (!existsSync(fontPath)) {
        console.error(`Font not found: ${fontPath}`)
        console.error(
            'Download it with: curl -L -o examples/tmp/Roboto-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/roboto/Roboto%5Bwdth%2Cwght%5D.ttf"',
        )
        process.exit(1)
    }

    const fontData = readFileSync(fontPath)

    // PdfFont.fromBytes automatically:
    // - Detects font format (TTF, OTF, WOFF)
    // - Parses font tables and extracts metrics
    // - Creates a ready-to-use PdfFont instance
    // - Throws descriptive errors for unsupported formats (WOFF2, CFF-based OTF)
    const robotoFont = PdfFont.fromBytes(fontData)

    console.log(
        `Created PdfFont from bytes - Font name: ${robotoFont.fontName}`,
    )
    console.log(`  Font data size: ${fontData.length} bytes`)
    console.log(
        `  Embedded font data preserved: ${robotoFont.fontData ? 'Yes' : 'No'}`,
    )

    // Write the font to the document
    await document.fonts.write(robotoFont)
    console.log(`Embedded custom font in PDF: ${robotoFont}`)

    // Create resources dictionary with fonts
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()

    // Add fonts to the font dictionary using their resource names and references
    // Use the fonts directly - they already have their resource names assigned
    fontDict.set(new PdfName(helveticaBold.resourceName), helveticaBold.fontRef)
    fontDict.set(new PdfName(timesRoman.resourceName), timesRoman.fontRef)
    fontDict.set(new PdfName(courier.resourceName), courier.fontRef)
    fontDict.set(new PdfName(robotoFont.resourceName), robotoFont.fontRef)

    console.log(`\nFont resource mappings:`)
    console.log(`  ${helveticaBold.resourceName} = Helvetica-Bold`)
    console.log(`  ${timesRoman.resourceName} = Times-Roman`)
    console.log(`  ${courier.resourceName} = Courier`)
    console.log(`  ${robotoFont.resourceName} = Roboto-Regular`)

    resourcesDict.set('Font', fontDict)
    const resources = new PdfIndirectObject({ content: resourcesDict })

    // Build content stream with different fonts
    // F1=Helvetica-Bold, F2=Times-Roman, F3=Courier, F4=Roboto
    const lines: string[] = [
        'BT',
        '/F1 24 Tf',
        '72 700 Td',
        '(PDF-Lite Custom Fonts Demo) Tj',
        '/F4 16 Tf',
        '0 -40 Td',
        '(This line uses embedded Roboto font via PdfFont.fromBytes!) Tj',
        '/F2 14 Tf',
        '0 -30 Td',
        '(This line uses Times Roman) Tj',
        '/F3 12 Tf',
        '0 -30 Td',
        '(This line uses Courier - great for code!) Tj',
        '/F2 12 Tf',
        '0 -50 Td',
        '(PdfFont.fromBytes auto-detects font formats:) Tj',
        '0 -20 Td',
        '(- TTF \\(TrueType Fonts\\)) Tj',
        '0 -20 Td',
        '(- OTF \\(OpenType Fonts - non-CFF based\\)) Tj',
        '0 -20 Td',
        '(- WOFF \\(Web Open Font Format\\)) Tj',
        '/F2 10 Tf',
        '0 -30 Td',
        '(Standard PDF fonts built into all readers:) Tj',
        '0 -16 Td',
        '(Helvetica, Times-Roman, Courier, Symbol, ZapfDingbats) Tj',
        '/F4 12 Tf',
        '0 -30 Td',
        '(Custom fonts are automatically parsed and embedded!) Tj',
        'ET',
    ]

    const contentStream = new PdfIndirectObject({
        content: new PdfStream({
            header: new PdfDictionary(),
            original: lines.join('\n'),
        }),
    })

    // Create page
    const page = createPage(contentStream, resources, pages)

    // Update pages collection
    pages.content.set('Kids', new PdfArray([page.reference]))
    pages.content.set('Count', new PdfNumber(1))

    document.add(resources, contentStream, page)
    await document.commit()

    // Write output
    const outputPath = `${import.meta.dirname}/tmp/fonts-demo.pdf`
    writeFileSync(outputPath, document.toBytes())
    console.log(`\nPDF written to: ${outputPath}`)
}

main().catch(console.error)
