import { PdfFormField } from './pdf-form-field.js'
import { PdfButtonAppearanceStream } from '../appearance/pdf-button-appearance-stream.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import type { PdfAppearanceStream } from '../appearance/pdf-appearance-stream.js'
import type { PdfStream } from '../../core/objects/pdf-stream.js'

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
            return false
        }
        this.content.set('V', new PdfName(strVal))
        fieldParent?.content.set('V', new PdfName(strVal))
        this.content.set('AS', new PdfName(strVal))
        return true
    }

    override get checked(): boolean {
        const v = this.content.get('V') ?? this.parent?.content.get('V')
        return v instanceof PdfName && v.value === 'Yes'
    }

    override set checked(isChecked: boolean) {
        const target = this.parent ?? this
        if (isChecked) {
            target.content.set('V', new PdfName('Yes'))
            this.content.set('AS', new PdfName('Yes'))
        } else {
            target.content.set('V', new PdfName('Off'))
            this.content.set('AS', new PdfName('Off'))
        }
    }

    override getAppearanceStream(): PdfStream | undefined {
        if (this.checked && this._appearanceStreamYes) {
            return this._appearanceStreamYes.content
        }
        return this._appearanceStream?.content
    }

    override getAppearanceStreamsForWriting():
        | { primary: PdfAppearanceStream; secondary?: PdfAppearanceStream }
        | undefined {
        if (!this._appearanceStream) return undefined
        return {
            primary: this._appearanceStream,
            secondary: this._appearanceStreamYes,
        }
    }

    override setAppearanceReference(
        appearanceStreamRef: PdfObjectReference,
        appearanceStreamYesRef?: PdfObjectReference,
    ): void {
        let apDict = this.appearanceStreamDict
        if (!apDict) {
            apDict = new PdfDictionary()
            this.appearanceStreamDict = apDict
        }
        if (appearanceStreamYesRef) {
            const stateDict = new PdfDictionary()
            stateDict.set('Off', appearanceStreamRef)
            stateDict.set('Yes', appearanceStreamYesRef)
            apDict.set('N', stateDict)
        } else {
            apDict.set('N', appearanceStreamRef)
        }
    }

    generateAppearance(options?: { makeReadOnly?: boolean }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        this._appearanceStream = new PdfButtonAppearanceStream({
            width,
            height,
            contentStream: '',
        })

        // Merge own flags with parent flags so inherited bits (e.g. Radio) are
        // not lost when a child widget has its own Ff entry (even Ff: 0).
        const effectiveFlags =
            this.flags.flags | (this.parent?.flags?.flags ?? 0)
        const yesContent = PdfButtonAppearanceStream.buildYesContent(
            width,
            height,
            effectiveFlags,
        )
        this._appearanceStreamYes = new PdfButtonAppearanceStream({
            width,
            height,
            contentStream: yesContent,
        })

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
