import { PdfFormField } from './pdf-form-field.js'
import { PdfButtonAppearanceStream } from '../appearance/pdf-button-appearance-stream.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfString } from '../../core/objects/pdf-string.js'

/**
 * Button form field subtype (checkboxes, radio buttons, push buttons).
 */
export class PdfButtonFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Btn', PdfButtonFormField)
    }

    override set defaultValue(val: string) {
        this.content.set('DV', new PdfName(val))
    }

    protected override _storeValue(
        val: string | PdfString,
        fieldParent: PdfFormField | undefined,
    ): boolean {
        const strVal = val instanceof PdfString ? val.value : val
        if (strVal.trim() === '') {
            this.content.delete('V')
            fieldParent?.content.delete('V')
            this.content.delete('AS')
            for (const child of this.children) {
                child.content.set('AS', new PdfName('Off'))
            }
            return false
        }
        // Check if the value matches an existing appearance state;
        // otherwise map truthy values to the widget's "on" state (the
        // first state that isn't "Off"), falling back to "Yes".
        // For parent fields with no AP of their own (separated field/widget
        // structure), derive the available states from the child widgets.
        let states = this.appearanceStates
        if (states.length === 0) {
            const kidOnStates = this.children
                .flatMap((child) => child.appearanceStates)
                .filter((s) => s !== 'Off')
            if (kidOnStates.length > 0) {
                states = [...new Set(kidOnStates), 'Off']
            }
        }
        let resolved: string
        if (states.includes(strVal)) {
            resolved = strVal
        } else if (strVal === 'Off') {
            resolved = 'Off'
        } else {
            resolved = states.find((s) => s !== 'Off') ?? strVal
        }
        this.content.set('V', new PdfName(resolved))
        fieldParent?.content.set('V', new PdfName(resolved))
        this.content.set('AS', new PdfName(resolved))
        // For parent fields with a separated widget structure (kids have the
        // actual Rect/AP), update each kid's AS to reflect the new value.
        // If the kids already have AP streams, skip generating new ones so
        // the original appearance content (e.g. custom checkmark styles) is
        // preserved.
        const kids = this.children
        if (kids.length > 0) {
            let kidsHaveAP = false
            for (const child of kids) {
                const childStates = child.appearanceStates
                if (childStates.includes(resolved)) {
                    child.content.set('AS', new PdfName(resolved))
                } else {
                    child.content.set('AS', new PdfName('Off'))
                }
                if (child.content.get('AP')) kidsHaveAP = true
            }
            if (kidsHaveAP) return false
        }
        return true
    }

    get checked(): boolean {
        const v = this.content.get('V') ?? this.parent?.content.get('V')
        return v instanceof PdfName && v.value !== 'Off'
    }

    set checked(isChecked: boolean) {
        const target = this.parent ?? this
        if (isChecked) {
            const onState =
                this.appearanceStates.find((s) => s !== 'Off') ?? 'Yes'
            target.content.set('V', new PdfName(onState))
            this.content.set('AS', new PdfName(onState))
        } else {
            target.content.set('V', new PdfName('Off'))
            this.content.set('AS', new PdfName('Off'))
        }
    }

    generateAppearance(options?: { makeReadOnly?: boolean }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        // Merge own flags with parent flags so inherited bits (e.g. Radio) are
        // not lost when a child widget has its own Ff entry (even Ff: 0).
        const effectiveFlags =
            this.flags.flags | (this.parent?.flags?.flags ?? 0)

        const yesAppearance = PdfButtonAppearanceStream.buildYesContent(
            width,
            height,
            effectiveFlags,
        )

        const noAppearance = new PdfButtonAppearanceStream({
            width,
            height,
            contentStream: '',
        })

        const onState = this.appearanceStates.find((s) => s !== 'Off') ?? 'Yes'
        this.setAppearanceStream({
            [onState]: yesAppearance,
            Off: noAppearance,
        })

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
