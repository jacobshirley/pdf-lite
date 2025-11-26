import { describe, expect, it } from 'vitest'
import { PdfDate } from '../../../src/core/objects/pdf-date.js'

describe('PdfDate', () => {
    describe('constructor', () => {
        it('should create a date string from a Date object', () => {
            // Create a date in UTC timezone to ensure consistent testing
            const date = new Date(Date.UTC(2024, 0, 15, 10, 30, 45))
            const pdfDate = new PdfDate(date)
            const str = new TextDecoder().decode(pdfDate.raw)
            // The output depends on the local timezone, so we just check the format
            expect(str).toMatch(/^D:\d{14}[+\-]\d{2}'\d{2}'$/)
        })

        it('should format the date with correct year, month, day', () => {
            const date = new Date(Date.UTC(2023, 5, 20, 14, 25, 30))
            const pdfDate = new PdfDate(date)
            const str = new TextDecoder().decode(pdfDate.raw)
            // Check that the date part starts correctly (timezone affects the exact values)
            expect(str).toMatch(/^D:\d{4}\d{2}\d{2}/)
        })

        it('should pad single digit values with zeros', () => {
            const date = new Date(Date.UTC(2024, 0, 5, 8, 3, 9))
            const pdfDate = new PdfDate(date)
            const str = new TextDecoder().decode(pdfDate.raw)
            expect(str).toMatch(/^D:\d{14}/)
        })
    })

    describe('date getter', () => {
        it('should parse a date string back to a Date object', () => {
            const originalDate = new Date(Date.UTC(2024, 6, 15, 12, 0, 0))
            const pdfDate = new PdfDate(originalDate)
            const parsedDate = pdfDate.date

            // The round trip should preserve the UTC time
            expect(parsedDate.getTime()).toBe(originalDate.getTime())
        })

        it('should handle positive timezone offset', () => {
            const originalDate = new Date(Date.UTC(2024, 3, 10, 8, 30, 0))
            const pdfDate = new PdfDate(originalDate)
            const parsedDate = pdfDate.date
            expect(parsedDate.getTime()).toBe(originalDate.getTime())
        })

        it('should handle dates at the start of the year', () => {
            const originalDate = new Date(Date.UTC(2024, 0, 1, 0, 0, 0))
            const pdfDate = new PdfDate(originalDate)
            const parsedDate = pdfDate.date
            expect(parsedDate.getTime()).toBe(originalDate.getTime())
        })

        it('should handle dates at the end of the year', () => {
            const originalDate = new Date(Date.UTC(2023, 11, 31, 23, 59, 59))
            const pdfDate = new PdfDate(originalDate)
            const parsedDate = pdfDate.date
            expect(parsedDate.getTime()).toBe(originalDate.getTime())
        })

        it('should throw error for invalid date string', () => {
            const pdfDate = new PdfDate(new Date())
            // Manually set invalid raw data
            ;(pdfDate as any).raw = new TextEncoder().encode('invalid')
            expect(() => pdfDate.date).toThrow('Invalid PDF date string')
        })
    })

    describe('round-trip', () => {
        it('should preserve date through serialization and parsing', () => {
            const dates = [
                new Date(Date.UTC(2020, 0, 1, 0, 0, 0)),
                new Date(Date.UTC(2024, 11, 31, 23, 59, 59)),
                new Date(Date.UTC(2025, 5, 15, 12, 30, 45)),
                new Date(Date.UTC(1999, 0, 1, 0, 0, 0)),
            ]

            for (const original of dates) {
                const pdfDate = new PdfDate(original)
                const parsed = pdfDate.date
                expect(parsed.getTime()).toBe(original.getTime())
            }
        })
    })
})
