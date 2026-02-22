import { describe, it, expect } from 'vitest'
import { PdfContentStream } from '../../src/content/pdf-content-stream'
import { PdfDefaultAppearance } from '../../src/acroform/fields/pdf-default-appearance'

describe('PdfContentStream', () => {
    describe('PDF Operator Generation', () => {
        it('should generate valid text operators', () => {
            const graphics = new PdfContentStream()
            const da = PdfDefaultAppearance.parse('/Helvetica 12 Tf 0 g')!
            graphics.setDefaultAppearance(da)
            graphics.beginText()
            graphics.showText('Hello', false)
            graphics.endText()

            graphics.build()
            const content = graphics.contentStream
            expect(content).toContain('/Helvetica 12 Tf 0 g')
            expect(content).toContain('BT')
            expect(content).toContain('ET')
            expect(content).toContain('(Hello) Tj')
        })
    })

    describe('color methods', () => {
        it('setFillRGB should emit r g b rg operator', () => {
            const graphics = new PdfContentStream()
            graphics.setFillRGB(1, 0.5, 0)
            graphics.build()
            expect(graphics.contentStream).toContain('1 0.5 0 rg')
        })

        it('setFillRGB with black should emit 0 0 0 rg', () => {
            const graphics = new PdfContentStream()
            graphics.setFillRGB(0, 0, 0)
            graphics.build()
            expect(graphics.contentStream).toContain('0 0 0 rg')
        })

        it('setFillGray should emit v g operator', () => {
            const graphics = new PdfContentStream()
            graphics.setFillGray(0.5)
            graphics.build()
            expect(graphics.contentStream).toContain('0.5 g')
        })

        it('setFillGray with 0 should emit 0 g', () => {
            const graphics = new PdfContentStream()
            graphics.setFillGray(0)
            graphics.build()
            expect(graphics.contentStream).toContain('0 g')
        })
    })

    describe('setFont', () => {
        it('should emit /name size Tf operator', () => {
            const graphics = new PdfContentStream()
            graphics.setFont('ZaDb', 12)
            graphics.build()
            expect(graphics.contentStream).toContain('/ZaDb 12 Tf')
        })

        it('should emit correct operator for fractional size', () => {
            const graphics = new PdfContentStream()
            graphics.setFont('Helvetica', 8.5)
            graphics.build()
            expect(graphics.contentStream).toContain('/Helvetica 8.5 Tf')
        })
    })

    describe('path drawing methods', () => {
        it('movePath should emit x y m operator', () => {
            const graphics = new PdfContentStream()
            graphics.movePath(10, 20)
            graphics.build()
            expect(graphics.contentStream).toContain('10 20 m')
        })

        it('lineTo should emit x y l operator', () => {
            const graphics = new PdfContentStream()
            graphics.lineTo(30, 40)
            graphics.build()
            expect(graphics.contentStream).toContain('30 40 l')
        })

        it('curveTo should emit x1 y1 x2 y2 x3 y3 c operator', () => {
            const graphics = new PdfContentStream()
            graphics.curveTo(1, 2, 3, 4, 5, 6)
            graphics.build()
            expect(graphics.contentStream).toContain('1 2 3 4 5 6 c')
        })

        it('fill should emit f operator', () => {
            const graphics = new PdfContentStream()
            graphics.fill()
            graphics.build()
            expect(graphics.contentStream).toContain('f')
        })

        it('stroke should emit S operator', () => {
            const graphics = new PdfContentStream()
            graphics.stroke()
            graphics.build()
            expect(graphics.contentStream).toContain('S')
        })

        it('closePath should emit h operator', () => {
            const graphics = new PdfContentStream()
            graphics.closePath()
            graphics.build()
            expect(graphics.contentStream).toContain('h')
        })

        it('should chain path operations correctly', () => {
            const graphics = new PdfContentStream()
            graphics
                .setFillRGB(0, 0, 0)
                .movePath(5, 10)
                .lineTo(15, 10)
                .lineTo(10, 20)
                .fill()

            graphics.build()
            const content = graphics.contentStream
            expect(content).toContain('0 0 0 rg')
            expect(content).toContain('5 10 m')
            expect(content).toContain('15 10 l')
            expect(content).toContain('10 20 l')
            expect(content).toContain('f')
        })
    })
})
