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
        this.content.set('V', new PdfName(strVal))
        fieldParent?.content.set('V', new PdfName(strVal))
        this.content.set('AS', new PdfName(strVal))

        // For parent fields with a separated widget structure (kids have the
        // actual Rect/AP), update each kid's AS to reflect the new value.
        // If the kids already have AP streams, skip generating new ones so
        // the original appearance content (e.g. custom checkmark styles) is
        // preserved.
        const kids = this.children
        if (kids.length > 0) {
            // Separated field/widget structure: update each kid's AS and
            // skip appearance generation if they already have AP streams.
            let kidsHaveAP = false
            for (const child of kids) {
                child.value = strVal
                if (child.content.get('AP')) kidsHaveAP = true
            }
            if (kidsHaveAP) return false
        } else if (this.appearanceStates.includes(strVal)) {
            // Standalone field already has an appearance for this state —
            // preserve it rather than overwriting with a generated one.
            return false
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
        const as = this.content.get('AS')?.value || onState
        this.setAppearanceStream({
            [as]: yesAppearance,
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
