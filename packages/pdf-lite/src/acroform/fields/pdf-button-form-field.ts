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

    get isGroup(): boolean {
        return this.children.length > 0
    }

    override get value(): string {
        return super.value
    }

    override set value(val: string | PdfString) {
        const strVal = val instanceof PdfString ? val.value : val
        const fieldParent = this.parent?.content.get('FT')
            ? this.parent
            : undefined

        if (strVal === 'Off') {
            this.content.set('V', new PdfName('Off'))
            fieldParent?.content.set('V', new PdfName('Off'))
            this.content.set('AS', new PdfName('Off'))
            for (const child of this.children) {
                child.content.set('AS', new PdfName('Off'))
            }
            this._form?.xfa?.datasets?.updateField(this.name, this.value)
            return
        }

        // Any non-"Off" value (including blank) means "checked".
        // V stores the raw value; AS uses the existing on-state from AP.
        this.content.set('V', new PdfName(strVal))
        fieldParent?.content.set('V', new PdfName(strVal))

        if (this.isGroup) {
            // Check the first child, uncheck the rest.
            // AS is set to the child's existing AP on-state, not the raw value.
            let first = true
            let needsGeneration = false
            for (const child of this.children) {
                const onState = child.appearanceStates.find((s) => s !== 'Off')
                if (first) {
                    child.content.set(
                        'AS',
                        new PdfName(onState ?? (strVal || 'Yes')),
                    )
                    if (!onState) needsGeneration = true
                    first = false
                } else {
                    child.content.set('AS', new PdfName('Off'))
                }
            }

            if (needsGeneration && this.defaultGenerateAppearance) {
                for (const child of this.children) {
                    if (child.rect && child.defaultGenerateAppearance) {
                        if (this._form) child.form = this._form
                        child.generateAppearance()
                    }
                }
            }
        } else {
            const onState =
                this.appearanceStates.find((s) => s !== 'Off') ??
                (strVal || 'Yes')
            this.content.set('AS', new PdfName(onState))
            if (
                !this.appearanceStates.includes(onState) &&
                this.defaultGenerateAppearance
            ) {
                this.generateAppearance()
            }
        }

        this._form?.xfa?.datasets?.updateField(this.name, this.value)
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
        const as = this.content.get('AS')?.value || onState
        this.appearanceStream = {
            [as]: yesAppearance,
            Off: noAppearance,
        }

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
