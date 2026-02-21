import { describe, it, expect, vi } from 'vitest'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfString } from '../../src/core/objects/pdf-string'
import { PdfStream } from '../../src/core/objects/pdf-stream'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfJavaScriptAction } from '../../src/acroform/js/pdf-javascript-action'
import { PdfFieldActions } from '../../src/acroform/js/pdf-field-actions'
import { PdfTextFormField } from '../../src/acroform/fields/pdf-text-form-field'
import { PdfAcroForm } from '../../src/acroform/acroform'
import type {
    PdfJsEngine,
    PdfJsEvent,
} from '../../src/acroform/js/pdf-js-engine'

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

    it('returns empty string when /JS is absent', () => {
        const dict = new PdfDictionary()
        dict.set('S', new PdfName('JavaScript'))

        const action = new PdfJavaScriptAction(dict)
        expect(action.code).toBe('')
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
    function buildFormWithField(validateJs?: string, calculateJs?: string) {
        const acroForm = new PdfAcroForm()

        const field = new PdfTextFormField({ form: acroForm })
        field.fieldType = 'Text'
        field.name = 'Amount'
        field.defaultAppearance = '/Helv 12 Tf 0 g'

        if (validateJs || calculateJs) {
            const aa = new PdfDictionary()
            if (validateJs) aa.set('V', makeActionDict(validateJs))
            if (calculateJs) aa.set('C', makeActionDict(calculateJs))
            field.content.set('AA', aa)
        }

        acroForm.fields.push(field)
        return { acroForm, field }
    }

    it('calls jsEngine.execute with validate event after importData', () => {
        const calls: { code: string; event: PdfJsEvent }[] = []
        const engine: PdfJsEngine = {
            execute(code, event) {
                calls.push({ code, event })
            },
        }

        const { acroForm } = buildFormWithField('event.rc = true;')
        acroForm.jsEngine = engine

        acroForm.importData({ Amount: '100' } as any)

        const validateCall = calls.find((c) => c.code === 'event.rc = true;')
        expect(validateCall).toBeDefined()
        expect(validateCall!.event.fieldName).toBe('Amount')
        expect(validateCall!.event.value).toBe('100')
        expect(validateCall!.event.willCommit).toBe(true)
        expect(validateCall!.event.rc).toBe(true)
    })

    it('calls jsEngine.execute with calculate event after importData', () => {
        const calls: { code: string; event: PdfJsEvent }[] = []
        const engine: PdfJsEngine = {
            execute(code, event) {
                calls.push({ code, event })
            },
        }

        const { acroForm } = buildFormWithField(undefined, '/* calc */')
        acroForm.jsEngine = engine

        acroForm.importData({ Amount: '200' } as any)

        const calcCall = calls.find((c) => c.code === '/* calc */')
        expect(calcCall).toBeDefined()
        expect(calcCall!.event.fieldName).toBe('Amount')
    })

    it('calls jsEngine.execute with both validate and calculate on setValues', () => {
        const codes: string[] = []
        const engine: PdfJsEngine = {
            execute(code) {
                codes.push(code)
            },
        }

        const { acroForm } = buildFormWithField('/* validate */', '/* calc */')
        acroForm.jsEngine = engine

        acroForm.setValues({ Amount: '50' } as any)

        expect(codes).toContain('/* validate */')
        expect(codes).toContain('/* calc */')
    })

    it('does not throw when jsEngine is not set', () => {
        const { acroForm } = buildFormWithField('event.rc = true;')
        // No jsEngine assigned — should silently skip JS execution
        expect(() => acroForm.importData({ Amount: '99' } as any)).not.toThrow()
    })

    it('validate fires before calculate across multiple fields', () => {
        const order: string[] = []
        const engine: PdfJsEngine = {
            execute(code) {
                order.push(code)
            },
        }

        const acroForm = new PdfAcroForm()
        acroForm.jsEngine = engine

        const fieldA = new PdfTextFormField({ form: acroForm })
        fieldA.fieldType = 'Text'
        fieldA.name = 'A'
        const aaA = new PdfDictionary()
        aaA.set('V', makeActionDict('/* validate A */'))
        fieldA.content.set('AA', aaA)
        acroForm.fields.push(fieldA)

        const fieldB = new PdfTextFormField({ form: acroForm })
        fieldB.fieldType = 'Text'
        fieldB.name = 'B'
        const aaB = new PdfDictionary()
        aaB.set('C', makeActionDict('/* calc B */'))
        fieldB.content.set('AA', aaB)
        acroForm.fields.push(fieldB)

        acroForm.importData({ A: '1', B: '2' } as any)

        // validate A fires during the per-field loop (before calculate sweep)
        const validateIdx = order.indexOf('/* validate A */')
        const calcIdx = order.indexOf('/* calc B */')
        expect(validateIdx).toBeGreaterThanOrEqual(0)
        expect(calcIdx).toBeGreaterThanOrEqual(0)
        expect(validateIdx).toBeLessThan(calcIdx)
    })
})
