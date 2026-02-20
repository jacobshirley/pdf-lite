import { PdfNumber } from '../core/objects/pdf-number.js'

/**
 * Provides annotation flag (F field) accessors for PDF annotations.
 * These are generic to all annotation types per the PDF spec.
 */
export class PdfAnnotationFlags extends PdfNumber {
    constructor(value: number = 0) {
        super(value)
    }

    get annotationFlags(): number {
        return this.value
    }

    set annotationFlags(flags: number) {
        this.value = flags
    }

    get invisible(): boolean {
        return (this.annotationFlags & 1) !== 0
    }

    set invisible(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 1
        } else {
            this.annotationFlags = this.annotationFlags & ~1
        }
    }

    get hidden(): boolean {
        return (this.annotationFlags & 2) !== 0
    }

    set hidden(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 2
        } else {
            this.annotationFlags = this.annotationFlags & ~2
        }
    }

    get print(): boolean {
        return (this.annotationFlags & 4) !== 0
    }

    set print(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 4
        } else {
            this.annotationFlags = this.annotationFlags & ~4
        }
    }

    get noZoom(): boolean {
        return (this.annotationFlags & 8) !== 0
    }

    set noZoom(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 8
        } else {
            this.annotationFlags = this.annotationFlags & ~8
        }
    }

    get noRotate(): boolean {
        return (this.annotationFlags & 16) !== 0
    }

    set noRotate(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 16
        } else {
            this.annotationFlags = this.annotationFlags & ~16
        }
    }

    get noView(): boolean {
        return (this.annotationFlags & 32) !== 0
    }

    set noView(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 32
        } else {
            this.annotationFlags = this.annotationFlags & ~32
        }
    }

    get locked(): boolean {
        return (this.annotationFlags & 128) !== 0
    }

    set locked(value: boolean) {
        if (value) {
            this.annotationFlags = this.annotationFlags | 128
        } else {
            this.annotationFlags = this.annotationFlags & ~128
        }
    }
}
