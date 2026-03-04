import { describe, it, expect } from 'vitest'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfString } from '../../src/core/objects/pdf-string'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfStream } from '../../src/core/objects/pdf-stream'
import { PdfJavaScriptAction } from '../../src/acroform/js/pdf-javascript-action'
import { PdfFieldActions } from '../../src/acroform/js/pdf-field-actions'
import { PdfTextFormField } from '../../src/acroform/fields/pdf-text-form-field'
import { PdfAcroForm } from '../../src/acroform/pdf-acro-form'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { server } from 'vitest/browser'
import { ByteArray } from '../../src/types'
import type {
    PdfJsEngine,
    PdfJsEvent,
} from '../../src/acroform/js/pdf-js-engine'

const base64ToBytes = (base64: string): ByteArray => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
}

// ---------------------------------------------------------------------------
// PdfJavaScriptAction
// ---------------------------------------------------------------------------

describe('PdfJavaScriptAction', () => {
    it('reads code from a PdfString /JS entry', () => {
        const dict = new PdfDictionary()
        dict.set('S', new PdfName('JavaScript'))
        dict.set('JS', new PdfString('event.value = "hello";'))

        const action = new PdfJavaScriptAction(dict)
        expect(action.code).toBe('event.value = "hello";')
    })

    it('reads code from a PdfStream /JS entry', () => {
        const jsCode = 'var x = 42;'
        const stream = PdfStream.fromString(jsCode)

        const dict = new PdfDictionary()
        dict.set('S', new PdfName('JavaScript'))
        dict.set('JS', stream)

        const action = new PdfJavaScriptAction(dict)
        expect(action.code).toBe(jsCode)
    })

    it('returns null when /JS is absent', () => {
        const dict = new PdfDictionary()
        dict.set('S', new PdfName('JavaScript'))

        const action = new PdfJavaScriptAction(dict)
        expect(action.code).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// PdfFieldActions
// ---------------------------------------------------------------------------

function makeActionDict(js: string): PdfDictionary {
    const d = new PdfDictionary()
    d.set('S', new PdfName('JavaScript'))
    d.set('JS', new PdfString(js))
    return d
}

describe('PdfFieldActions', () => {
    it('exposes validate action from /AA V key', () => {
        const aa = new PdfDictionary()
        aa.set('V', makeActionDict('/* validate */'))

        const actions = new PdfFieldActions(aa)
        expect(actions.validate).not.toBeNull()
        expect(actions.validate!.code).toBe('/* validate */')
    })

    it('exposes keystroke action from /AA K key', () => {
        const aa = new PdfDictionary()
        aa.set('K', makeActionDict('/* keystroke */'))

        const actions = new PdfFieldActions(aa)
        expect(actions.keystroke).not.toBeNull()
        expect(actions.keystroke!.code).toBe('/* keystroke */')
    })

    it('exposes calculate action from /AA C key', () => {
        const aa = new PdfDictionary()
        aa.set('C', makeActionDict('/* calculate */'))

        const actions = new PdfFieldActions(aa)
        expect(actions.calculate).not.toBeNull()
        expect(actions.calculate!.code).toBe('/* calculate */')
    })

    it('exposes format action from /AA F key', () => {
        const aa = new PdfDictionary()
        aa.set('F', makeActionDict('/* format */'))

        const actions = new PdfFieldActions(aa)
        expect(actions.format).not.toBeNull()
        expect(actions.format!.code).toBe('/* format */')
    })

    it('returns null for absent action keys', () => {
        const aa = new PdfDictionary()
        const actions = new PdfFieldActions(aa)

        expect(actions.validate).toBeNull()
        expect(actions.keystroke).toBeNull()
        expect(actions.calculate).toBeNull()
        expect(actions.format).toBeNull()
        expect(actions.activate).toBeNull()
    })

    it('exposes activate action from the /A dict passed in constructor', () => {
        const aa = new PdfDictionary()
        const a = makeActionDict('/* activate */')

        const actions = new PdfFieldActions(aa, a)
        expect(actions.activate).not.toBeNull()
        expect(actions.activate!.code).toBe('/* activate */')
    })
})

// ---------------------------------------------------------------------------
// PdfFormField.actions and PdfFormField.activateAction
// ---------------------------------------------------------------------------

describe('PdfFormField actions getters', () => {
    it('returns null when field has no /AA entry', () => {
        const field = new PdfTextFormField()
        expect(field.actions).toBeNull()
    })

    it('returns PdfFieldActions when field has /AA entry', () => {
        const field = new PdfTextFormField()
        const aa = new PdfDictionary()
        aa.set('V', makeActionDict('event.rc = true;'))
        field.content.set('AA', aa)

        const actions = field.actions
        expect(actions).not.toBeNull()
        expect(actions!.validate).not.toBeNull()
        expect(actions!.validate!.code).toBe('event.rc = true;')
    })

    it('returns null activateAction when field has no /A entry', () => {
        const field = new PdfTextFormField()
        expect(field.activateAction).toBeNull()
    })

    it('returns PdfJavaScriptAction when field has /A entry', () => {
        const field = new PdfTextFormField()
        field.content.set('A', makeActionDict('app.alert("clicked");'))

        const action = field.activateAction
        expect(action).not.toBeNull()
        expect(action!.code).toBe('app.alert("clicked");')
    })

    it('PdfFieldActions.activate mirrors /A dict on the field', () => {
        const field = new PdfTextFormField()
        const aa = new PdfDictionary()
        field.content.set('AA', aa)
        field.content.set('A', makeActionDict('app.alert("hi");'))

        expect(field.actions!.activate!.code).toBe('app.alert("hi");')
        expect(field.activateAction!.code).toBe('app.alert("hi");')
    })
})

// ---------------------------------------------------------------------------
// PdfAcroForm.jsEngine integration
// ---------------------------------------------------------------------------

describe('PdfAcroForm jsEngine integration', () => {
    it('calls jsEngine.execute with validate event on setValues', () => {
        const calls: { code: string; event: PdfJsEvent }[] = []
        const engine: PdfJsEngine = {
            execute(code, event) {
                calls.push({ code, event: { ...event } })
            },
        }

        const acroForm = new PdfAcroForm()
        acroForm.jsEngine = engine

        const field = new PdfTextFormField({ form: acroForm })
        field.fieldType = 'Text'
        field.name = 'Amount'
        field.defaultAppearance = '/Helv 12 Tf 0 g'
        const aa = new PdfDictionary()
        aa.set('V', makeActionDict('event.rc = true;'))
        field.content.set('AA', aa)
        acroForm.addField(field)

        acroForm.setValues({ Amount: '100' })

        const validateCall = calls.find((c) => c.code === 'event.rc = true;')
        expect(validateCall).toBeDefined()
        expect(validateCall!.event.fieldName).toBe('Amount')
        expect(validateCall!.event.value).toBe('100')
        expect(validateCall!.event.willCommit).toBe(true)
        expect(validateCall!.event.rc).toBe(true)
    })

    it('skips field update when validate sets rc = false', () => {
        const engine: PdfJsEngine = {
            execute(_code, event) {
                event.rc = false
            },
        }

        const acroForm = new PdfAcroForm()
        acroForm.jsEngine = engine

        const field = new PdfTextFormField({ form: acroForm })
        field.fieldType = 'Text'
        field.name = 'Blocked'
        field.defaultAppearance = '/Helv 12 Tf 0 g'
        const aa = new PdfDictionary()
        aa.set('V', makeActionDict('event.rc = false;'))
        field.content.set('AA', aa)
        acroForm.addField(field)

        acroForm.setValues({ Blocked: 'rejected' })

        expect(field.value).toBe('')
    })

    it('does not throw when jsEngine is not set', () => {
        const acroForm = new PdfAcroForm()
        const field = new PdfTextFormField({ form: acroForm })
        field.fieldType = 'Text'
        field.name = 'Safe'
        field.defaultAppearance = '/Helv 12 Tf 0 g'
        const aa = new PdfDictionary()
        aa.set('V', makeActionDict('event.rc = true;'))
        field.content.set('AA', aa)
        acroForm.addField(field)

        expect(() => acroForm.importData({ Safe: '99' })).not.toThrow()
    })

    it('validate fires before calculate', () => {
        const order: string[] = []
        const engine: PdfJsEngine = {
            execute(code) {
                order.push(code)
            },
        }

        const acroForm = new PdfAcroForm()
        acroForm.jsEngine = engine

        const fieldA = new PdfTextFormField({ form: acroForm })
        fieldA.objectNumber = 100
        fieldA.fieldType = 'Text'
        fieldA.name = 'A'
        fieldA.defaultAppearance = '/Helv 12 Tf 0 g'
        const aaA = new PdfDictionary()
        aaA.set('V', makeActionDict('/* validate A */'))
        fieldA.content.set('AA', aaA)
        acroForm.addField(fieldA)

        const fieldB = new PdfTextFormField({ form: acroForm })
        fieldB.objectNumber = 101
        fieldB.fieldType = 'Text'
        fieldB.name = 'B'
        fieldB.defaultAppearance = '/Helv 12 Tf 0 g'
        const aaB = new PdfDictionary()
        aaB.set('C', makeActionDict('/* calc B */'))
        fieldB.content.set('AA', aaB)
        acroForm.addField(fieldB)

        // Set up /CO (calculation order) so _fireCalculate processes fieldB
        acroForm.content.set('CO', PdfArray.refs([fieldB]))

        acroForm.importData({ A: '1', B: '2' })

        const validateIdx = order.indexOf('/* validate A */')
        const calcIdx = order.indexOf('/* calc B */')
        expect(validateIdx).toBeGreaterThanOrEqual(0)
        expect(calcIdx).toBeGreaterThanOrEqual(0)
        expect(validateIdx).toBeLessThan(calcIdx)
    })
})

// ---------------------------------------------------------------------------
// Integration: protectedAdobeLivecycle.pdf
// ---------------------------------------------------------------------------

describe('LiveCycle PDF JS actions', () => {
    it('should parse the LiveCycle PDF acroform without errors', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/protectedAdobeLivecycle.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer], {
            password: '',
        })

        const acroForm = document.acroform
        expect(acroForm).not.toBeNull()

        const fields = acroForm!.fields

        // For every field that exists, verify actions can be read without error
        for (const field of fields) {
            const actions = field.actions
            if (actions) {
                // Verify each trigger getter works
                for (const getter of [
                    'keystroke',
                    'validate',
                    'calculate',
                    'format',
                ] as const) {
                    const action = actions[getter]
                    if (action) {
                        expect(typeof action.code).toBe('string')
                        expect(action.code!.length).toBeGreaterThan(0)
                    }
                }
            }

            const activateAction = field.activateAction
            if (activateAction) {
                expect(typeof activateAction.code).toBe('string')
                expect(activateAction.code!.length).toBeGreaterThan(0)
            }
        }
    })

    it('should allow jsEngine to be set on LiveCycle PDF acroform', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/protectedAdobeLivecycle.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer], {
            password: '',
        })

        const acroForm = document.acroform!
        const executedCodes: string[] = []
        const engine: PdfJsEngine = {
            execute(code) {
                executedCodes.push(code)
            },
        }
        acroForm.jsEngine = engine

        // Find a text field to set a value on
        const textField = acroForm.fields.find(
            (f) => f.fieldType === 'Text' && f.name,
        )
        if (!textField) return

        // Setting a value should not throw, even if no JS actions exist
        acroForm.setValues({ [textField.name]: 'test-value' })

        // If the field had a validate action, the engine should have been called
        if (textField.actions?.validate) {
            expect(executedCodes.length).toBeGreaterThan(0)
        }
    })
})
