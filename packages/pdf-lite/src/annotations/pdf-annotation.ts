import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfAnnotationFlags } from './pdf-annotation-flags.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfString } from '../core/objects/pdf-string.js'

export type PdfAppearanceStreamDictionary = PdfDictionary<{
    N: PdfObjectReference | PdfDictionary
    R?: PdfObjectReference | PdfDictionary
    D?: PdfObjectReference | PdfDictionary
}>

/**
 * Base class for all PDF annotations.
 */
export class PdfAnnotation extends PdfIndirectObject<
    PdfDictionary<{
        Type: PdfName
        Subtype: PdfName
        AS: PdfName
        Ff: PdfNumber
        FT: PdfName
        T: PdfString
        DV: PdfString | PdfName
        V: PdfString | PdfName
        DA: PdfString
        DR: PdfDictionary
        Opt: PdfArray<PdfString | PdfArray<PdfString>> | PdfObjectReference
        MaxLen: PdfNumber
        Q: PdfNumber
        Kids: PdfArray<PdfObjectReference>
        Rect: PdfArray<PdfNumber>
        F: PdfNumber
        AP?: PdfAppearanceStreamDictionary
        P?: PdfObjectReference
        Parent?: PdfObjectReference
    }>
> {
    private _annotationFlags?: PdfAnnotationFlags

    private get flags_(): PdfAnnotationFlags {
        if (!this._annotationFlags) {
            const flagValue = this.content.get('F')?.as(PdfNumber)?.value ?? 0
            this._annotationFlags = new PdfAnnotationFlags(flagValue)
            this.content.set('F', this._annotationFlags)
        }
        return this._annotationFlags
    }

    constructor(options?: { other?: PdfIndirectObject }) {
        super(
            options?.other ??
                new PdfIndirectObject({ content: new PdfDictionary() }),
        )
        // Eagerly initialize when constructed normally
        this.flags_
    }

    get rect(): [number, number, number, number] | null {
        const rectArray = this.content.get('Rect')?.as(PdfArray<PdfNumber>)
        if (!rectArray) return null
        return rectArray.items.map((num) => num.value) as [
            number,
            number,
            number,
            number,
        ]
    }

    set rect(rect: [number, number, number, number] | null) {
        if (rect === null) {
            this.content.delete('Rect')
            return
        }
        const rectArray = new PdfArray<PdfNumber>(
            rect.map((num) => new PdfNumber(num)),
        )
        this.content.set('Rect', rectArray)
    }

    get annotationFlags(): number {
        return this.flags_.annotationFlags
    }

    set annotationFlags(flags: number) {
        this.flags_.annotationFlags = flags
    }

    get invisible(): boolean {
        return this.flags_.invisible
    }

    set invisible(value: boolean) {
        this.flags_.invisible = value
    }

    get hidden(): boolean {
        return this.flags_.hidden
    }

    set hidden(value: boolean) {
        this.flags_.hidden = value
    }

    get print(): boolean {
        return this.flags_.print
    }

    set print(value: boolean) {
        this.flags_.print = value
    }

    get noZoom(): boolean {
        return this.flags_.noZoom
    }

    set noZoom(value: boolean) {
        this.flags_.noZoom = value
    }

    get noRotate(): boolean {
        return this.flags_.noRotate
    }

    set noRotate(value: boolean) {
        this.flags_.noRotate = value
    }

    get noView(): boolean {
        return this.flags_.noView
    }

    set noView(value: boolean) {
        this.flags_.noView = value
    }

    get locked(): boolean {
        return this.flags_.locked
    }

    set locked(value: boolean) {
        this.flags_.locked = value
    }

    get appearanceStreamDict(): PdfAppearanceStreamDictionary | null {
        const apDict = this.content.get('AP')?.as(PdfDictionary)
        if (!apDict) return null
        return apDict
    }

    set appearanceStreamDict(dict: PdfAppearanceStreamDictionary | null) {
        if (dict === null) {
            this.content.delete('AP')
            return
        }
        this.content.set('AP', dict)
    }

    get parentRef(): PdfObjectReference | null {
        const ref = this.content.get('P')?.as(PdfObjectReference)
        return ref ?? null
    }

    set parentRef(ref: PdfObjectReference | null) {
        if (ref === null) {
            this.content.delete('P')
        } else {
            this.content.set('P', ref)
        }
    }
}
