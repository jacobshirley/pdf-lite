import { PdfFormField } from './pdf-form-field.js'
import { PdfButtonAppearanceStream } from '../appearance/pdf-button-appearance-stream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
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
        const fieldParent = this.parent?.fieldType ? this.parent : undefined

        if (strVal === 'Off') {
            this.content.set('V', new PdfName('Off'))
            fieldParent?.content.set('V', new PdfName('Off'))
            this.appearanceState = 'Off'
            for (const child of this.children) {
                child.appearanceState = 'Off'
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
            // Each child in a radio group MUST have a unique on-state name so
            // PDF viewers can distinguish them (e.g. "0", "1", "2", …).
            let needsGeneration = false
            const children = this.children
            // Resolve each child's unique on-state name
            const onStates: string[] = []
            for (let i = 0; i < children.length; i++) {
                const existing = children[i].appearanceStates.find(
                    (s) => s !== 'Off',
                )
                if (existing) {
                    onStates.push(existing)
                } else {
                    onStates.push(String(i))
                    needsGeneration = true
                }
            }

            // First child is selected; set AS to its on-state.
            // All other children get AS = Off.
            for (let i = 0; i < children.length; i++) {
                children[i].appearanceState = i === 0 ? onStates[i] : 'Off'
            }

            // V must match the selected child's on-state for Acrobat to
            // correlate which widget is active.
            const selectedOnState = onStates[0]
            this.content.set('V', new PdfName(strVal || selectedOnState))
            fieldParent?.content.set(
                'V',
                new PdfName(strVal || selectedOnState),
            )

            if (needsGeneration && this.defaultGenerateAppearance) {
                for (let i = 0; i < children.length; i++) {
                    const child = children[i]
                    if (child.rect && child.defaultGenerateAppearance) {
                        if (this._form) child.form = this._form
                        child.generateAppearance({
                            onStateName: onStates[i],
                        })
                    }
                }
            }
        } else {
            const onState =
                this.appearanceStates.find((s) => s !== 'Off') ??
                (strVal || 'Yes')
            this.appearanceState = onState
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
            this.appearanceState = onState
        } else {
            target.content.set('V', new PdfName('Off'))
            this.appearanceState = 'Off'
        }
    }

    generateAppearance(options?: {
        makeReadOnly?: boolean
        onStateName?: string
    }): boolean {
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

        const existingOnState = this.appearanceStates.find((s) => s !== 'Off')
        const as = this.appearanceState
        const onKey =
            options?.onStateName ??
            existingOnState ??
            (as && as !== 'Off' ? as : 'Yes')
        this.appearanceStream = {
            [onKey]: yesAppearance,
            Off: noAppearance,
        }

        // Also set the Down (D) appearance so Acrobat doesn't synthesize
        // an oversized one from the DA string during click/focus.
        const downDict = new PdfDictionary()
        downDict.set(onKey, yesAppearance.reference)
        downDict.set('Off', noAppearance.reference)
        this.appearanceStreamDict!.set('D', downDict)

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
