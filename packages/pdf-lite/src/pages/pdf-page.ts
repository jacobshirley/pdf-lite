import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfObject } from '../core/objects/pdf-object.js'

export interface PdfPageOptions {
    width: number
    height: number
    rotate?: 0 | 90 | 180 | 270
    parent?: PdfObjectReference
}

export type PdfPageDictionary = PdfDictionary<{
    Type: PdfName
    MediaBox: PdfArray
    CropBox?: PdfArray
    TrimBox?: PdfArray
    BleedBox?: PdfArray
    ArtBox?: PdfArray
    Rotate?: PdfNumber
    Contents?: PdfObjectReference | PdfArray
    Resources?: PdfDictionary
    Parent?: PdfObjectReference
}>

/**
 * Represents a PDF Page object with type-safe property accessors.
 * Wraps a PdfIndirectObject<PdfDictionary> and provides convenient methods
 * for accessing and manipulating page properties.
 *
 * Inspired by iText's PdfPage concept, this class provides a high-level
 * abstraction over the raw page dictionary while maintaining pdf-lite's
 * low-level philosophy for content streams.
 */
export class PdfPage extends PdfIndirectObject<PdfPageDictionary> {
    /**
     * Creates a new PdfPage from options or wraps an existing page dictionary.
     *
     * @param options - Page creation options or existing PdfIndirectObject
     */
    constructor(options: PdfPageOptions | PdfIndirectObject<PdfDictionary>) {
        if (options instanceof PdfIndirectObject) {
            // Wrap existing page dictionary
            super(options)
            this._validatePageDictionary()
        } else {
            // Create new page dictionary
            const pageDict: PdfPageDictionary = new PdfDictionary()
            pageDict.set('Type', new PdfName('Page'))
            pageDict.set(
                'MediaBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(options.width),
                    new PdfNumber(options.height),
                ]),
            )

            if (options.rotate !== undefined) {
                pageDict.set('Rotate', new PdfNumber(options.rotate))
            }

            if (options.parent) {
                pageDict.set('Parent', options.parent)
            }

            super({ content: pageDict })

            // Validate rotation after super() call
            if (options.rotate !== undefined) {
                this._validateRotation(options.rotate)
            }
        }
    }

    /**
     * Gets the MediaBox (visible page area).
     * Required for all pages, defines the boundaries of the physical or digital medium.
     */
    get mediaBox(): PdfArray | undefined {
        return this.content.get('MediaBox') as PdfArray | undefined
    }

    set mediaBox(box: PdfArray) {
        this._validateBox(box)
        this.content.set('MediaBox', box)
    }

    /**
     * Gets the CropBox (visible region for display/printing).
     * Optional - defaults to MediaBox if not specified.
     */
    get cropBox(): PdfArray | undefined {
        return this.content.get('CropBox') as PdfArray | undefined
    }

    set cropBox(box: PdfArray | undefined) {
        if (box) {
            this._validateBox(box)
            this.content.set('CropBox', box)
        }
    }

    /**
     * Gets the TrimBox (finished page size after trimming).
     * Optional - used in printing workflows.
     */
    get trimBox(): PdfArray | undefined {
        return this.content.get('TrimBox') as PdfArray | undefined
    }

    set trimBox(box: PdfArray | undefined) {
        if (box) {
            this._validateBox(box)
            this.content.set('TrimBox', box)
        }
    }

    /**
     * Gets the BleedBox (clipping region for artwork in production).
     * Optional - used in printing workflows.
     */
    get bleedBox(): PdfArray | undefined {
        return this.content.get('BleedBox') as PdfArray | undefined
    }

    set bleedBox(box: PdfArray | undefined) {
        if (box) {
            this._validateBox(box)
            this.content.set('BleedBox', box)
        }
    }

    /**
     * Gets the ArtBox (meaningful content region).
     * Optional - used by PDF processors.
     */
    get artBox(): PdfArray | undefined {
        return this.content.get('ArtBox') as PdfArray | undefined
    }

    set artBox(box: PdfArray | undefined) {
        if (box) {
            this._validateBox(box)
            this.content.set('ArtBox', box)
        }
    }

    /**
     * Gets the page rotation in degrees (0, 90, 180, or 270).
     * Rotation is clockwise from the default orientation.
     */
    get rotate(): number | undefined {
        const rotateObj = this.content.get('Rotate') as PdfNumber | undefined
        return rotateObj?.value
    }

    set rotate(degrees: 0 | 90 | 180 | 270 | undefined) {
        if (degrees !== undefined) {
            this._validateRotation(degrees)
            this.content.set('Rotate', new PdfNumber(degrees))
        }
    }

    /**
     * Gets the content stream(s) for this page.
     * Can be a single stream reference or an array of stream references.
     */
    get contents(): PdfObjectReference | PdfArray | undefined {
        const contents = this.content.get('Contents')
        if (contents instanceof PdfObjectReference) {
            return contents
        }
        if (contents instanceof PdfArray) {
            return contents
        }
        return undefined
    }

    set contents(contents: PdfObjectReference | PdfArray | undefined) {
        if (contents) {
            this.content.set('Contents', contents)
        }
    }

    /**
     * Gets the Resources dictionary for this page.
     * Contains fonts, XObjects, color spaces, etc.
     * Auto-creates if not present.
     */
    get resources(): PdfDictionary {
        let resources = this.content.get('Resources') as
            | PdfDictionary
            | undefined
        if (!resources) {
            resources = new PdfDictionary()
            this.content.set('Resources', resources)
        }
        return resources
    }

    set resources(resources: PdfDictionary) {
        this.content.set('Resources', resources)
    }

    /**
     * Gets the parent Pages node reference.
     */
    get parent(): PdfObjectReference | undefined {
        return this.content.get('Parent') as PdfObjectReference | undefined
    }

    set parent(parent: PdfObjectReference | undefined) {
        if (parent) {
            this.content.set('Parent', parent)
        }
    }

    /**
     * Gets the page dimensions from the MediaBox.
     * @returns Object with width and height, or undefined if MediaBox is not set
     */
    getDimensions(): { width: number; height: number } | undefined {
        const mediaBox = this.mediaBox
        if (!mediaBox) {
            return undefined
        }

        const values = this._extractBoxValues(mediaBox)
        if (!values) {
            return undefined
        }

        return {
            width: values.urx - values.llx,
            height: values.ury - values.lly,
        }
    }

    /**
     * Adds a content stream reference to this page.
     * If the page already has a single content stream, converts it to an array.
     * If the page has an array, appends to it.
     *
     * @param streamRef - Reference to a PdfStream object containing page content
     */
    addContentStream(streamRef: PdfObjectReference): void {
        const currentContents = this.contents

        if (!currentContents) {
            // No existing content, set as single reference
            this.contents = streamRef
        } else if (currentContents instanceof PdfObjectReference) {
            // Single reference exists, convert to array
            this.contents = new PdfArray([currentContents, streamRef])
        } else if (currentContents instanceof PdfArray) {
            // Array exists, append
            currentContents.push(streamRef)
        }
    }

    /**
     * Sets the content streams for this page, replacing any existing content.
     *
     * @param streamRefs - Array of stream references, or single reference
     */
    setContentStreams(
        streamRefs: PdfObjectReference[] | PdfObjectReference,
    ): void {
        if (Array.isArray(streamRefs)) {
            if (streamRefs.length === 0) {
                this.content.set('Contents', undefined)
            } else if (streamRefs.length === 1) {
                this.contents = streamRefs[0]
            } else {
                this.contents = new PdfArray(streamRefs)
            }
        } else {
            this.contents = streamRefs
        }
    }

    private _validatePageDictionary(): void {
        const type = this.content.get('Type') as PdfName | undefined
        if (type && type.value !== 'Page') {
            throw new Error(
                `Invalid page dictionary: Type must be 'Page', got '${type.value}'`,
            )
        }
    }

    private _validateBox(box: PdfArray): void {
        if (box.length !== 4) {
            throw new Error(
                `Invalid box: must have exactly 4 numbers, got ${box.length}`,
            )
        }

        const values = this._extractBoxValues(box)
        if (!values) {
            throw new Error('Invalid box: all values must be numbers')
        }

        if (values.urx <= values.llx || values.ury <= values.lly) {
            throw new Error(
                'Invalid box: upper-right corner must be greater than lower-left corner',
            )
        }
    }

    private _extractBoxValues(
        box: PdfArray,
    ): { llx: number; lly: number; urx: number; ury: number } | undefined {
        const llx = box.items[0] as PdfNumber | undefined
        const lly = box.items[1] as PdfNumber | undefined
        const urx = box.items[2] as PdfNumber | undefined
        const ury = box.items[3] as PdfNumber | undefined

        if (
            !llx ||
            !lly ||
            !urx ||
            !ury ||
            !(llx instanceof PdfNumber) ||
            !(lly instanceof PdfNumber) ||
            !(urx instanceof PdfNumber) ||
            !(ury instanceof PdfNumber)
        ) {
            return undefined
        }

        return {
            llx: llx.value,
            lly: lly.value,
            urx: urx.value,
            ury: ury.value,
        }
    }

    private _validateRotation(degrees: number): void {
        if (![0, 90, 180, 270].includes(degrees)) {
            throw new Error(
                `Invalid rotation: must be 0, 90, 180, or 270, got ${degrees}`,
            )
        }
    }
}
