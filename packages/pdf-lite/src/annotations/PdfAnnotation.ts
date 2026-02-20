import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfAnnotationFlags } from './PdfAnnotationFlags.js'

export type PdfAppearanceStreamDictionary = PdfDictionary<{
    N: PdfObjectReference | PdfDictionary
    R?: PdfObjectReference | PdfDictionary
    D?: PdfObjectReference | PdfDictionary
}>

/**
 * Base class for all PDF annotations.
 * Owns: Rect, annotation flags (F), AP (appearance streams), P (page reference).
 */
export class PdfAnnotation extends PdfIndirectObject<PdfDictionary> {
    private _annotationFlags: PdfAnnotationFlags

    constructor(options?: { other?: PdfIndirectObject }) {
        super(
            options?.other ??
                new PdfIndirectObject({ content: new PdfDictionary() }),
        )
        const flagValue = this.content.get('F')?.as(PdfNumber)?.value ?? 0
        this._annotationFlags = new PdfAnnotationFlags(flagValue)
        this.content.set('F', this._annotationFlags)
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
        return this._annotationFlags.annotationFlags
    }

    set annotationFlags(flags: number) {
        this._annotationFlags.annotationFlags = flags
    }

    get invisible(): boolean {
        return this._annotationFlags.invisible
    }

    set invisible(value: boolean) {
        this._annotationFlags.invisible = value
    }

    get hidden(): boolean {
        return this._annotationFlags.hidden
    }

    set hidden(value: boolean) {
        this._annotationFlags.hidden = value
    }

    get print(): boolean {
        return this._annotationFlags.print
    }

    set print(value: boolean) {
        this._annotationFlags.print = value
    }

    get noZoom(): boolean {
        return this._annotationFlags.noZoom
    }

    set noZoom(value: boolean) {
        this._annotationFlags.noZoom = value
    }

    get noRotate(): boolean {
        return this._annotationFlags.noRotate
    }

    set noRotate(value: boolean) {
        this._annotationFlags.noRotate = value
    }

    get noView(): boolean {
        return this._annotationFlags.noView
    }

    set noView(value: boolean) {
        this._annotationFlags.noView = value
    }

    get locked(): boolean {
        return this._annotationFlags.locked
    }

    set locked(value: boolean) {
        this._annotationFlags.locked = value
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
