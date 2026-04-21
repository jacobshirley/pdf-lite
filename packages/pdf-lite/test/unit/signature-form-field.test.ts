import { describe, it, expect } from 'vitest'
import { PdfSignatureFormField } from '../../src/acroform/fields/pdf-signature-form-field'
import { PdfFormField } from '../../src/acroform/fields/pdf-form-field'
import {
    PdfSignatureDictionary,
    PdfSignatureObject,
} from '../../src/signing/signatures/base'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfString } from '../../src/core/objects/pdf-string'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfNumber } from '../../src/core/objects/pdf-number'

function makeRawSigField(
    overrides: Record<string, any> = {},
): PdfIndirectObject {
    const dict = new PdfDictionary({
        FT: new PdfName('Sig'),
        T: new PdfString('Signature1'),
        Subtype: new PdfName('Widget'),
        Rect: new PdfArray([
            new PdfNumber(100),
            new PdfNumber(200),
            new PdfNumber(300),
            new PdfNumber(260),
        ]),
        ...overrides,
    })
    return new PdfIndirectObject({ content: dict })
}

function makeSignature(entries: Record<string, any> = {}): PdfSignatureObject {
    const dict = new PdfSignatureDictionary({
        Type: new PdfName('Sig'),
        Filter: new PdfName('Adobe.PPKLite'),
        SubFilter: new PdfName('adbe.pkcs7.detached'),
        ...entries,
    })
    return PdfSignatureObject.fromIndirectObject(new PdfIndirectObject(dict))
}

describe('PdfSignatureFormField', () => {
    describe('type registration', () => {
        it('PdfFormField.create returns a PdfSignatureFormField for FT=/Sig', () => {
            const field = PdfFormField.create(makeRawSigField())
            expect(field).toBeInstanceOf(PdfSignatureFormField)
        })

        it('fieldType getter returns "Signature"', () => {
            const field = PdfFormField.create(makeRawSigField())
            expect(field.fieldType).toBe('Signature')
        })
    })

    describe('blank factory', () => {
        it('creates an unsigned placeholder field with the given name + rect', () => {
            const field = PdfSignatureFormField.blank({
                name: 'ClientSignature',
                rect: [50, 50, 250, 110],
            })

            expect(field).toBeInstanceOf(PdfSignatureFormField)
            expect(field.fieldType).toBe('Signature')
            expect(field.name).toBe('ClientSignature')
            expect(field.rect).toEqual([50, 50, 250, 110])
            expect(field.isSigned).toBe(false)
        })

        it('defaults to a reasonable rect and generated name when omitted', () => {
            const field = PdfSignatureFormField.blank()
            expect(field.fieldType).toBe('Signature')
            expect(field.name.length).toBeGreaterThan(0)
            expect(field.rect).toHaveLength(4)
        })
    })

    describe('isSigned', () => {
        it('is false by default', () => {
            const field = PdfFormField.create(makeRawSigField())
            expect(field instanceof PdfSignatureFormField).toBe(true)
            expect((field as PdfSignatureFormField).isSigned).toBe(false)
        })

        it('is true once a signature is attached', () => {
            const field = PdfSignatureFormField.blank()
            expect(field.isSigned).toBe(false)
            field.signature = makeSignature({ Name: new PdfString('John Doe') })
            expect(field.isSigned).toBe(true)
        })
    })

    describe('signature metadata accessors', () => {
        it('returns null when no signature is attached', () => {
            const field = PdfSignatureFormField.blank()
            expect(field.signerName).toBeNull()
            expect(field.reason).toBeNull()
            expect(field.location).toBeNull()
            expect(field.contactInfo).toBeNull()
            expect(field.signedAt).toBeNull()
            expect(field.signature).toBeNull()
        })

        it('reads Name / Reason / Location / ContactInfo from the attached signature', () => {
            const field = PdfSignatureFormField.blank()
            field.signature = makeSignature({
                Name: new PdfString('Jane Smith'),
                Reason: new PdfString('I approve this document'),
                Location: new PdfString('Berlin'),
                ContactInfo: new PdfString('jane@example.com'),
            })
            expect(field.signerName).toBe('Jane Smith')
            expect(field.reason).toBe('I approve this document')
            expect(field.location).toBe('Berlin')
            expect(field.contactInfo).toBe('jane@example.com')
        })

        it('writes through to the attached signature', () => {
            const field = PdfSignatureFormField.blank()
            field.signature = makeSignature()
            field.signerName = 'Alice'
            field.reason = 'Review'

            expect(field.signerName).toBe('Alice')
            expect(field.reason).toBe('Review')
            expect(field.signature!.content.get('Type')?.toString()).toBe(
                '/Sig',
            )
        })

        it('throws when setting metadata on an unsigned field', () => {
            const field = PdfSignatureFormField.blank()
            expect(() => {
                field.signerName = 'Alice'
            }).toThrow(/signature/i)
        })

        it('setting a metadata prop to null removes it', () => {
            const field = PdfSignatureFormField.blank()
            field.signature = makeSignature({ Name: new PdfString('Alice') })
            expect(field.signerName).toBe('Alice')
            field.signerName = null
            expect(field.signerName).toBeNull()
        })
    })

    describe('signedAt', () => {
        it('returns a Date when M is set on the signature', () => {
            const field = PdfSignatureFormField.blank()
            field.signature = makeSignature({
                M: new PdfString('D:20240515103045Z'),
            })
            const when = field.signedAt
            expect(when).toBeInstanceOf(Date)
            expect(when!.getUTCFullYear()).toBe(2024)
            expect(when!.getUTCMonth()).toBe(4)
            expect(when!.getUTCDate()).toBe(15)
        })

        it('setting signedAt writes a PDF date into the signature', () => {
            const field = PdfSignatureFormField.blank()
            field.signature = makeSignature()
            field.signedAt = new Date(Date.UTC(2026, 0, 1, 12, 0, 0))
            const raw = field.signature?.content.get('M')?.as(PdfString)?.value
            expect(raw).toBeDefined()
            expect(raw).toMatch(/^D:20260101120000(Z|[+\-]\d{2}'?\d{2}'?)$/)
        })
    })

    describe('generateAppearance', () => {
        it('returns false if rect is missing', () => {
            const field = PdfFormField.create(
                makeRawSigField({ Rect: undefined }),
            ) as PdfSignatureFormField
            field.rect = null
            expect(field.generateAppearance()).toBe(false)
        })

        it('returns true for an unsigned field with a valid rect', () => {
            const field = PdfSignatureFormField.blank()
            expect(field.generateAppearance()).toBe(true)
            expect(field.appearanceStreamDict).toBeDefined()
        })
    })
})
