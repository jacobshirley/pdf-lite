import { assert, describe, expect, it } from 'vitest'
import { PdfXrefLookup } from '../../../src/pdf/pdf-xref-lookup.js'
import { PdfObject } from '../../../src/core/objects/pdf-object.js'
import { PdfIndirectObject } from '../../../src/core/objects/pdf-indirect-object.js'
import {
    PdfXRefStream,
    PdfXRefStreamCompressedEntry,
    PdfXRefStreamStandardEntry,
} from '../../../src/core/objects/pdf-stream.js'
import {
    PdfXRefTable,
    PdfXRefTableEntry,
} from '../../../src/core/objects/pdf-xref-table.js'
import { PdfTrailer } from '../../../src/core/objects/pdf-trailer.js'
import { PdfNumber } from '../../../src/core/objects/pdf-number.js'
import { PdfStartXRef } from '../../../src/core/objects/pdf-start-xref.js'
import { PdfComment } from '../../../src/core/objects/pdf-comment.js'

describe('PDF Xref Lookup', () => {
    const xrefStream = new PdfIndirectObject({
        content: PdfXRefStream.fromEntries([
            new PdfXRefTableEntry({
                objectNumber: 1,
                byteOffset: 200,
                generationNumber: 0,
                inUse: true,
            }),
            new PdfXRefTableEntry({
                objectNumber: 2,
                byteOffset: 300,
                generationNumber: 0,
                inUse: true,
            }),
            new PdfXRefStreamCompressedEntry({
                objectNumber: 3,
                objectStreamNumber: 5,
                index: 0,
            }),
        ]),
        offset: 100,
    })

    const xrefTable = new PdfXRefTable()
    const objects: PdfObject[] = [
        xrefStream,
        xrefTable,
        new PdfTrailer({
            Size: new PdfNumber(1),
            Prev: new PdfNumber(xrefStream.offset),
        }),
        new PdfStartXRef(xrefTable.offset),
        PdfComment.EOF,
    ]
    const xrefLookup = PdfXrefLookup.fromObjects(objects)

    it('should chain multiple xref table or stream lookups', () => {
        expect(xrefLookup.object).toBeInstanceOf(PdfXRefTable)
        expect(xrefLookup.object).toEqual(xrefTable)
        expect(xrefLookup.prev?.object).toEqual(xrefStream)

        const entry1 = xrefLookup.getObject(2)!
        assert(entry1 instanceof PdfXRefStreamStandardEntry)
        expect(entry1.byteOffset.value).toBe(300)
    })

    it('should find compressed entries in xref streams', () => {
        const entry = xrefLookup.getObject(3)!
        assert(entry instanceof PdfXRefStreamCompressedEntry)
        expect(entry.objectNumber.value).toBe(3)
        expect(entry.index.value).toBe(0)
    })
})
