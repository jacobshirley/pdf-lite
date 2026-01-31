// Custom font embedding example
// Demonstrates how to embed TrueType fonts and use standard PDF fonts

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { parseFont } from 'pdf-lite'

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

    // Embed Roboto TrueType font
    const fontPath = `${import.meta.dirname}/tmp/Roboto-Regular.ttf`

    if (!existsSync(fontPath)) {
        console.error(`Font not found: ${fontPath}`)
        console.error(
            'Download it with: curl -L -o examples/tmp/Roboto-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/roboto/Roboto%5Bwdth%2Cwght%5D.ttf"',
        )
        process.exit(1)
    }

    const fontData = readFileSync(fontPath)

    // Parse the font file to extract metrics automatically
    // parseFont() auto-detects TTF, OTF, and WOFF formats
    const parser = parseFont(fontData)
    const fontInfo = parser.getFontInfo()
    const fontDescriptor = parser.getFontDescriptor('Roboto')

    console.log(`Parsed font: ${fontInfo.fullName} (${fontInfo.fontFamily})`)

    const robotoFont = await document.fonts.embedTrueTypeFont(
        fontData,
        'Roboto',
        fontDescriptor,
    )
    console.log(`Embedded Roboto TrueType font: ${robotoFont}`)

    // Create resources dictionary with fonts
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()

    // Get font references from the font manager
    const helveticaFont = document.fonts.getFont('Helvetica-Bold')
    const timesFont = document.fonts.getFont('Times-Roman')
    const courierFont = document.fonts.getFont('Courier')

    if (helveticaFont)
        fontDict.set(helveticaFont.baseFont, helveticaFont.fontRef.reference)
    if (timesFont) fontDict.set(timesFont.baseFont, timesFont.fontRef.reference)
    if (courierFont)
        fontDict.set(courierFont.baseFont, courierFont.fontRef.reference)

    const roboto = document.fonts.getFont('Roboto')
    if (roboto) fontDict.set(roboto.baseFont, roboto.fontRef.reference)

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
        '(This line uses embedded Roboto font!) Tj',
        '/F2 14 Tf',
        '0 -30 Td',
        '(This line uses Times Roman) Tj',
        '/F3 12 Tf',
        '0 -30 Td',
        '(This line uses Courier - great for code!) Tj',
        '/F2 12 Tf',
        '0 -50 Td',
        '(Standard PDF fonts are built into all PDF readers:) Tj',
        '0 -20 Td',
        '(- Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique) Tj',
        '0 -20 Td',
        '(- Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic) Tj',
        '0 -20 Td',
        '(- Courier, Courier-Bold, Courier-Oblique, Courier-BoldOblique) Tj',
        '0 -20 Td',
        '(- Symbol, ZapfDingbats) Tj',
        '/F4 12 Tf',
        '0 -40 Td',
        '(Custom TrueType fonts like Roboto are embedded in the PDF file.) Tj',
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
