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
import { PdfJavaScriptEngine } from '../../src/acroform/js/pdf-js-engine-impl'
import {
    createBuiltins,
    printd,
    scand,
    printf,
} from '../../src/acroform/js/pdf-js-builtins'
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

    it('execute() calls engine with correct code and event', () => {
        const calls: { code: string; event: PdfJsEvent }[] = []
        const engine: PdfJsEngine = {
            execute(code, event) {
                calls.push({ code, event: { ...event } })
            },
        }

        const dict = new PdfDictionary()
        dict.set('S', new PdfName('JavaScript'))
        dict.set('JS', new PdfString('event.value = "test";'))

        const action = new PdfJavaScriptAction(dict, { engine })
        const event: PdfJsEvent = {
            fieldName: 'MyField',
            value: 'original',
            rc: true,
        }
        action.execute(event)

        expect(calls).toHaveLength(1)
        expect(calls[0].code).toBe('event.value = "test";')
        expect(calls[0].event.fieldName).toBe('MyField')
    })

    it('execute() is a no-op without engine', () => {
        const dict = new PdfDictionary()
        dict.set('JS', new PdfString('some code'))

        const action = new PdfJavaScriptAction(dict)
        const event: PdfJsEvent = {
            fieldName: 'F',
            value: '',
            rc: true,
        }
        expect(() => action.execute(event)).not.toThrow()
    })

    it('execute() is a no-op without code', () => {
        const calls: string[] = []
        const engine: PdfJsEngine = {
            execute(code) {
                calls.push(code)
            },
        }

        const dict = new PdfDictionary()
        const action = new PdfJavaScriptAction(dict, { engine })
        const event: PdfJsEvent = {
            fieldName: 'F',
            value: '',
            rc: true,
        }
        action.execute(event)
        expect(calls).toHaveLength(0)
    })

    it('dict.becomes(PdfJavaScriptAction) returns action with correct code', () => {
        const dict = new PdfDictionary()
        dict.set('S', new PdfName('JavaScript'))
        dict.set('JS', new PdfString('event.value = "hi";'))

        const action = dict.becomes(PdfJavaScriptAction)
        expect(action).toBeInstanceOf(PdfJavaScriptAction)
        expect(action.code).toBe('event.value = "hi";')
    })

    it('dict.becomes(PdfJavaScriptAction, { engine }) threads engine', () => {
        const calls: string[] = []
        const engine: PdfJsEngine = {
            execute(code) {
                calls.push(code)
            },
        }

        const dict = new PdfDictionary()
        dict.set('S', new PdfName('JavaScript'))
        dict.set('JS', new PdfString('x = 1;'))

        const action = dict.becomes(PdfJavaScriptAction, { engine })
        action.execute({ fieldName: 'F', value: '', rc: true })
        expect(calls).toEqual(['x = 1;'])
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

        const actions = new PdfFieldActions(aa, { activateDict: a })
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
// PdfJavaScriptEngine
// ---------------------------------------------------------------------------

describe('PdfJavaScriptEngine', () => {
    it('executes code that mutates event.value', () => {
        const engine = new PdfJavaScriptEngine()
        const event: PdfJsEvent = {
            fieldName: 'Name',
            value: 'hello',
            rc: true,
        }
        engine.execute('event.value = event.value.toUpperCase()', event)
        expect(event.value).toBe('HELLO')
    })

    it('provides a frozen app object', () => {
        const engine = new PdfJavaScriptEngine()
        const event: PdfJsEvent = {
            fieldName: 'F',
            value: '',
            rc: true,
        }
        // Frozen object — assignment silently fails in sloppy mode,
        // but app.alert must still be the original no-op function
        engine.execute('app.alert = "replaced"', event)
        engine.execute('event.value = typeof app.alert', event)
        expect(event.value).toBe('function')
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
        // Fixture may not have a named text field — skip the rest if so
        if (!textField) return

        // Setting a value should not throw, even if no JS actions exist
        acroForm.setValues({ [textField.name]: 'test-value' })

        // If the field had a validate action, the engine should have been called
        if (textField.actions?.validate) {
            expect(executedCodes.length).toBeGreaterThan(0)
        }
    })

    it('template.pdf toUpperCase validate action via becomes()', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )
        const document = await PdfDocument.fromBytes([pdfBuffer])
        const acroForm = document.acroform!

        const field = acroForm.fields.find((f) => f.name === 'Client Name')!
        expect(field).toBeDefined()

        const actions = field.actions!
        expect(actions).not.toBeNull()
        expect(actions.validate).not.toBeNull()
        expect(actions.validate!.code).toBe(
            'event.value = event.value.toUpperCase()',
        )
    })

    it('template.pdf executes toUpperCase action via PdfJavaScriptEngine', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )
        const document = await PdfDocument.fromBytes([pdfBuffer])
        const acroForm = document.acroform!

        acroForm.jsEngine = new PdfJavaScriptEngine()

        acroForm.setValues({ 'Client Name': 'hello world' })

        const field = acroForm.fields.find((f) => f.name === 'Client Name')!
        expect(field.value).toBe('HELLO WORLD')
    })

    it('action.execute() works when engine is threaded through form', () => {
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
        field.name = 'Direct'
        field.defaultAppearance = '/Helv 12 Tf 0 g'
        const aa = new PdfDictionary()
        aa.set('V', makeActionDict('/* direct validate */'))
        field.content.set('AA', aa)
        acroForm.addField(field)

        const action = field.actions!.validate!
        const event: PdfJsEvent = {
            fieldName: 'Direct',
            value: '42',
            rc: true,
        }
        action.execute(event)

        expect(calls).toHaveLength(1)
        expect(calls[0].code).toBe('/* direct validate */')
        expect(calls[0].event.fieldName).toBe('Direct')
    })
})

// ---------------------------------------------------------------------------
// util builtins
// ---------------------------------------------------------------------------

describe('util.printd', () => {
    const date = new Date(2025, 0, 15, 14, 30, 5) // Jan 15, 2025 14:30:05

    it('formats mm/dd/yyyy', () => {
        expect(printd('mm/dd/yyyy', date)).toBe('01/15/2025')
    })

    it('formats d-mmm-yy', () => {
        expect(printd('d-mmm-yy', date)).toBe('15-Jan-25')
    })

    it('formats with full month and day names', () => {
        expect(printd('dddd, mmmm dd, yyyy', date)).toBe(
            'Wednesday, January 15, 2025',
        )
    })

    it('formats 24-hour time', () => {
        expect(printd('HH:MM:ss', date)).toBe('14:30:05')
    })

    it('formats 12-hour time with AM/PM', () => {
        expect(printd('hh:MM tt', date)).toBe('02:30 PM')
    })
})

describe('util.scand', () => {
    it('parses mm/dd/yyyy', () => {
        const d = scand('mm/dd/yyyy', '01/15/2025')
        expect(d).not.toBeNull()
        expect(d!.getFullYear()).toBe(2025)
        expect(d!.getMonth()).toBe(0)
        expect(d!.getDate()).toBe(15)
    })

    it('parses dd-mmm-yyyy', () => {
        const d = scand('dd-mmm-yyyy', '15-Jan-2025')
        expect(d).not.toBeNull()
        expect(d!.getMonth()).toBe(0)
        expect(d!.getDate()).toBe(15)
    })

    it('returns null for non-matching string', () => {
        expect(scand('mm/dd/yyyy', 'not-a-date')).toBeNull()
    })
})

describe('util.printf', () => {
    it('formats float with precision', () => {
        expect(printf('%.2f', 3.1)).toBe('3.10')
    })

    it('formats integer', () => {
        expect(printf('%d', 42)).toBe('42')
    })

    it('formats string', () => {
        expect(printf('Hello %s!', 'world')).toBe('Hello world!')
    })

    it('formats with width padding', () => {
        expect(printf('%05d', 42)).toBe('00042')
    })

    it('handles %% escape', () => {
        expect(printf('%d%%', 100)).toBe('100%')
    })
})

// ---------------------------------------------------------------------------
// AF* builtins
// ---------------------------------------------------------------------------

describe('AFNumber_Format', () => {
    it('formats number with currency and commas', () => {
        const event: PdfJsEvent = { fieldName: 'F', value: '1234.5', rc: true }
        const builtins = createBuiltins(event)
        const fn = builtins.AFNumber_Format as Function
        fn(2, 0, 0, 0, '$', true)
        expect(event.value).toBe('$1,234.50')
    })

    it('formats negative with parentheses (negStyle=2)', () => {
        const event: PdfJsEvent = { fieldName: 'F', value: '-500', rc: true }
        const builtins = createBuiltins(event)
        const fn = builtins.AFNumber_Format as Function
        fn(2, 0, 2, 0, '', false)
        expect(event.value).toBe('(500.00)')
    })

    it('formats without thousand separator (sepStyle=1)', () => {
        const event: PdfJsEvent = { fieldName: 'F', value: '1234567', rc: true }
        const builtins = createBuiltins(event)
        const fn = builtins.AFNumber_Format as Function
        fn(0, 1, 0, 0, '', false)
        expect(event.value).toBe('1234567')
    })
})

describe('AFDate_FormatEx', () => {
    it('reformats a date string', () => {
        const event: PdfJsEvent = {
            fieldName: 'F',
            value: '2025-01-15',
            rc: true,
        }
        const builtins = createBuiltins(event)
        const fn = builtins.AFDate_FormatEx as Function
        fn('mm/dd/yyyy')
        expect(event.value).toBe('01/15/2025')
    })
})

describe('AFSimple_Calculate', () => {
    it('computes SUM from field values', () => {
        const event: PdfJsEvent = { fieldName: 'Total', value: '', rc: true }
        const resolver = (name: string) => {
            const vals: Record<string, string> = { A: '10', B: '20.5' }
            return vals[name] ?? '0'
        }
        const builtins = createBuiltins(event, resolver)
        const fn = builtins.AFSimple_Calculate as Function
        fn('SUM', ['A', 'B'])
        expect(event.value).toBe('30.5')
    })

    it('computes AVG', () => {
        const event: PdfJsEvent = { fieldName: 'Avg', value: '', rc: true }
        const resolver = (name: string) => {
            const vals: Record<string, string> = { A: '10', B: '20' }
            return vals[name] ?? '0'
        }
        const builtins = createBuiltins(event, resolver)
        const fn = builtins.AFSimple_Calculate as Function
        fn('AVG', ['A', 'B'])
        expect(event.value).toBe('15')
    })

    it('computes PRD', () => {
        const event: PdfJsEvent = { fieldName: 'P', value: '', rc: true }
        const resolver = (name: string) => {
            const vals: Record<string, string> = { A: '3', B: '4' }
            return vals[name] ?? '0'
        }
        const builtins = createBuiltins(event, resolver)
        const fn = builtins.AFSimple_Calculate as Function
        fn('PRD', ['A', 'B'])
        expect(event.value).toBe('12')
    })

    it('computes MIN and MAX', () => {
        const resolver = (name: string) => {
            const vals: Record<string, string> = { A: '5', B: '3', C: '8' }
            return vals[name] ?? '0'
        }
        const eventMin: PdfJsEvent = { fieldName: 'Min', value: '', rc: true }
        const bMin = createBuiltins(eventMin, resolver)
        ;(bMin.AFSimple_Calculate as Function)('MIN', ['A', 'B', 'C'])
        expect(eventMin.value).toBe('3')

        const eventMax: PdfJsEvent = { fieldName: 'Max', value: '', rc: true }
        const bMax = createBuiltins(eventMax, resolver)
        ;(bMax.AFSimple_Calculate as Function)('MAX', ['A', 'B', 'C'])
        expect(eventMax.value).toBe('8')
    })
})

describe('AFSpecial_Format', () => {
    it('formats phone number (psf=2)', () => {
        const event: PdfJsEvent = {
            fieldName: 'F',
            value: '1234567890',
            rc: true,
        }
        const builtins = createBuiltins(event)
        const fn = builtins.AFSpecial_Format as Function
        fn(2)
        expect(event.value).toBe('(123) 456-7890')
    })

    it('formats SSN (psf=1)', () => {
        const event: PdfJsEvent = {
            fieldName: 'F',
            value: '123456789',
            rc: true,
        }
        const builtins = createBuiltins(event)
        const fn = builtins.AFSpecial_Format as Function
        fn(1)
        expect(event.value).toBe('123-45-6789')
    })

    it('formats zip code (psf=0)', () => {
        const event: PdfJsEvent = { fieldName: 'F', value: '12345', rc: true }
        const builtins = createBuiltins(event)
        const fn = builtins.AFSpecial_Format as Function
        fn(0)
        expect(event.value).toBe('12345')
    })
})

// ---------------------------------------------------------------------------
// Integration: engine executes AFNumber_Format code
// ---------------------------------------------------------------------------

describe('PdfJavaScriptEngine with builtins', () => {
    it('executes AFNumber_Format via engine', () => {
        const engine = new PdfJavaScriptEngine()
        const event: PdfJsEvent = {
            fieldName: 'Amount',
            value: '1234.5',
            rc: true,
        }
        engine.execute('AFNumber_Format(2, 0, 0, 0, "$", true)', event)
        expect(event.value).toBe('$1,234.50')
    })

    it('executes util.printd via engine', () => {
        const engine = new PdfJavaScriptEngine()
        const event: PdfJsEvent = { fieldName: 'F', value: '', rc: true }
        engine.execute(
            'event.value = util.printd("mm/dd/yyyy", new Date(2025, 0, 15))',
            event,
        )
        expect(event.value).toBe('01/15/2025')
    })

    it('AFSimple_Calculate works with getFieldValue', () => {
        const engine = new PdfJavaScriptEngine({
            getFieldValue: (name) => {
                const vals: Record<string, string> = { A: '10', B: '20' }
                return vals[name] ?? '0'
            },
        })
        const event: PdfJsEvent = { fieldName: 'Total', value: '', rc: true }
        engine.execute('AFSimple_Calculate("SUM", ["A", "B"])', event)
        expect(event.value).toBe('30')
    })
})
