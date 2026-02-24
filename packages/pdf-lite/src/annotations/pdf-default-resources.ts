import { PdfArray, PdfDictionary } from '../core'

export class PdfDefaultResourcesDictionary extends PdfDictionary<{
    Font?: PdfDictionary
    ProcSet?: PdfArray
    ExtGState?: PdfDictionary
    ColorSpace?: PdfDictionary
    Pattern?: PdfDictionary
    Shading?: PdfDictionary
    XObject?: PdfDictionary
}> {}
