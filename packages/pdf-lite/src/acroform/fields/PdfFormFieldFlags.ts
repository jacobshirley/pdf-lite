import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'

/**
 * Field-specific Ff flag accessors for form fields.
 * These are separate from annotation flags (F field).
 */
export class PdfFormFieldFlags {
    dict: PdfDictionary
    parentDict?: PdfDictionary

    constructor(dict: PdfDictionary, parentDict?: PdfDictionary) {
        this.dict = dict
        this.parentDict = parentDict
    }

    get flags(): number {
        return (
            this.dict.get('Ff')?.as(PdfNumber)?.value ??
            this.parentDict?.get('Ff')?.as(PdfNumber)?.value ??
            0
        )
    }

    set flags(flags: number) {
        this.dict.set('Ff', new PdfNumber(flags))
    }

    private getFlag(bit: number): boolean {
        return (this.flags & bit) !== 0
    }

    private setFlag(bit: number, value: boolean): void {
        if (value) {
            this.flags = this.flags | bit
        } else {
            this.flags = this.flags & ~bit
        }
    }

    get readOnly(): boolean {
        return this.getFlag(1)
    }
    set readOnly(v: boolean) {
        this.setFlag(1, v)
    }

    get required(): boolean {
        return this.getFlag(2)
    }
    set required(v: boolean) {
        this.setFlag(2, v)
    }

    get noExport(): boolean {
        return this.getFlag(4)
    }
    set noExport(v: boolean) {
        this.setFlag(4, v)
    }

    get multiline(): boolean {
        return this.getFlag(4096)
    }
    set multiline(v: boolean) {
        this.setFlag(4096, v)
    }

    get password(): boolean {
        return this.getFlag(8192)
    }
    set password(v: boolean) {
        this.setFlag(8192, v)
    }

    get noToggleToOff(): boolean {
        return this.getFlag(16384)
    }
    set noToggleToOff(v: boolean) {
        this.setFlag(16384, v)
    }

    get radio(): boolean {
        return this.getFlag(32768)
    }
    set radio(v: boolean) {
        this.setFlag(32768, v)
    }

    get pushButton(): boolean {
        return this.getFlag(65536)
    }
    set pushButton(v: boolean) {
        this.setFlag(65536, v)
    }

    get combo(): boolean {
        return this.getFlag(131072)
    }
    set combo(v: boolean) {
        this.setFlag(131072, v)
    }

    get edit(): boolean {
        return this.getFlag(262144)
    }
    set edit(v: boolean) {
        this.setFlag(262144, v)
    }

    get sort(): boolean {
        return this.getFlag(524288)
    }
    set sort(v: boolean) {
        this.setFlag(524288, v)
    }

    get multiSelect(): boolean {
        return this.getFlag(2097152)
    }
    set multiSelect(v: boolean) {
        this.setFlag(2097152, v)
    }

    get doNotSpellCheck(): boolean {
        return this.getFlag(4194304)
    }
    set doNotSpellCheck(v: boolean) {
        this.setFlag(4194304, v)
    }

    get doNotScroll(): boolean {
        return this.getFlag(8388608)
    }
    set doNotScroll(v: boolean) {
        this.setFlag(8388608, v)
    }

    get comb(): boolean {
        return this.getFlag(16777216)
    }
    set comb(v: boolean) {
        this.setFlag(16777216, v)
    }

    get commitOnSelChange(): boolean {
        return this.getFlag(67108864)
    }
    set commitOnSelChange(v: boolean) {
        this.setFlag(67108864, v)
    }
}
