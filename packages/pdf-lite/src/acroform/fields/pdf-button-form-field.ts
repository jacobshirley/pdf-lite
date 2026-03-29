import { PdfFormField } from './pdf-form-field.js'
import { PdfButtonAppearanceStream } from '../appearance/pdf-button-appearance-stream.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import type { PdfAcroForm } from '../pdf-acro-form.js'
import type { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'

/**
 * Button form field subtype (checkboxes, radio buttons, push buttons).
 */
export class PdfButtonFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Btn', PdfButtonFormField)
    }

    constructor(other?: PdfIndirectObject | { form?: PdfAcroForm }) {
        super(other)
        if (this.isWidget && this.appearanceStates.length === 0) {
            this.initWidget()
        }
    }

    private initWidget() {
        this.rect ||= [0, 0, 50, 50]
        this.generateAppearance({
            onStateName: this.onState ?? 'Yes',
        })
        this.appearanceState ??= 'Off'
    }

    override set isWidget(val: boolean) {
        super.isWidget = val
        // Only initialize the widget if it has no existing appearances.
        // `appearanceStream` is write-only on PdfFormField, so instead check
        // the underlying appearance data structures.
        if (
            val &&
            !this.appearanceStreamDict &&
            this.appearanceStates.length === 0
        ) {
            this.initWidget()
        }
    }

    get isGroup(): boolean {
        return this.children.length > 0
    }

    override get value(): string {
        return super.value
    }

    override set value(val: string | PdfString) {
        const strVal = val instanceof PdfString ? val.value : val
        this.setRawValue(new PdfString(strVal))

        if (this.isGroup) {
            const children = this.children

            // 'Off' means explicitly uncheck all children
            if (strVal === 'Off') {
                for (const child of children) {
                    child.appearanceState = 'Off'
                    if (this._form) child.form = this._form
                }
            } else {
                let wasSet = false
                for (const child of children) {
                    const foundState = child.onStates.includes(strVal)
                    if (!wasSet && foundState) {
                        wasSet = true
                    }
                    child.appearanceState = foundState ? strVal : 'Off'
                    if (this._form) child.form = this._form
                }

                if (!wasSet && children.length > 0) {
                    // If value doesn't match any on-state, check first child by default
                    children[0].appearanceState =
                        children[0].onStates[0] ?? 'Off'
                }
            }
        } else {
            this.appearanceState = strVal
        }
    }

    get checked(): boolean {
        return !(this.appearanceState === 'Off' || this.value === 'Off')
    }

    set checked(isChecked: boolean) {
        if (isChecked) {
            this.value = this.onState ?? 'Yes'
        } else {
            this.value = 'Off'
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

        const existingOnState = this.onState
        const as = this.appearanceState
        const onKey =
            options?.onStateName ??
            (as && as !== 'Off' ? as : (existingOnState ?? 'Yes'))

        if (onKey === 'Off') {
            throw new Error(
                "Invalid on-state name 'Off' for button field appearance stream",
            )
        }

        this.appearanceStream = {
            [onKey]: yesAppearance,
            Off: noAppearance,
        }

        this.downAppearanceStream = {
            [onKey]: yesAppearance,
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
