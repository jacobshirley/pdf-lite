[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [pdf/pdf-xref-lookup](../README.md) / PdfXrefLookup

# Class: PdfXrefLookup

Manages cross-reference (xref) lookup for PDF objects.
Handles both traditional xref tables and xref streams, including hybrid documents.
Supports linking multiple revisions through the Prev chain.

## Constructors

### Constructor

> **new PdfXrefLookup**(`options?`): `PdfXrefLookup`

Creates a new xref lookup instance.

#### Parameters

##### options?

Configuration options

###### object?

[`PdfXRefTable`](../../../core/objects/pdf-xref-table/classes/PdfXRefTable.md) \| [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>\>

Pre-existing xref table or stream object

###### prev?

`PdfXrefLookup`

Previous xref lookup to link to

###### trailerDict?

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfTrailerEntries`](../../../core/objects/pdf-trailer/type-aliases/PdfTrailerEntries.md)\>

Pre-existing trailer dictionary

###### type?

`"stream"` \| `"table"`

Type of xref ('table' or 'stream')

#### Returns

`PdfXrefLookup`

## Properties

### entries

> **entries**: `Map`\<`number`, [`PdfXRefStreamEntry`](../../../core/objects/pdf-stream/type-aliases/PdfXRefStreamEntry.md)\>

Map of object numbers to their xref entries

---

### object

> **object**: [`PdfXRefTable`](../../../core/objects/pdf-xref-table/classes/PdfXRefTable.md) \| [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfXRefStream`](../../../core/objects/pdf-stream/classes/PdfXRefStream.md)\>

The underlying xref object (either a table or stream)

---

### prev?

> `optional` **prev**: `PdfXrefLookup`

Reference to the previous xref lookup in the revision chain

---

### trailerDict

> **trailerDict**: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfTrailerEntries`](../../../core/objects/pdf-trailer/type-aliases/PdfTrailerEntries.md)\>

Trailer dictionary containing document metadata references

## Accessors

### entriesValues

#### Get Signature

> **get** **entriesValues**(): [`PdfXRefStreamEntry`](../../../core/objects/pdf-stream/type-aliases/PdfXRefStreamEntry.md)[]

Gets all xref entries as an array.

##### Returns

[`PdfXRefStreamEntry`](../../../core/objects/pdf-stream/type-aliases/PdfXRefStreamEntry.md)[]

---

### offset

#### Get Signature

> **get** **offset**(): [`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

Gets the byte offset of the xref object.

##### Returns

[`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

#### Set Signature

> **set** **offset**(`value`): `void`

Sets the byte offset of the xref object.

##### Parameters

###### value

[`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

##### Returns

`void`

---

### size

#### Get Signature

> **get** **size**(): `number`

Gets the size of the xref table (highest object number + 1).
Ensures size is at least as large as the previous revision.

##### Returns

`number`

#### Set Signature

> **set** **size**(`value`): `void`

Sets the size of the xref table.

##### Parameters

###### value

`number`

##### Returns

`void`

## Methods

### addObject()

> **addObject**(`newObject`, `options?`): `void`

Adds an indirect object to the xref lookup.
Assigns an object number if not already set.

#### Parameters

##### newObject

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

The indirect object to add

##### options?

Options for compressed objects

###### indexInStream?

`number`

Index within the object stream

###### parentObjectNumber?

`number`

Object number of the containing object stream

#### Returns

`void`

#### Throws

Error if trying to add compressed object with non-zero generation number

---

### getObject()

> **getObject**(`objectNumber`): [`PdfXRefStreamEntry`](../../../core/objects/pdf-stream/type-aliases/PdfXRefStreamEntry.md) \| `undefined`

Gets an xref entry by object number.
Falls back to the previous xref if not found in current entries.

#### Parameters

##### objectNumber

`number`

The object number to look up

#### Returns

[`PdfXRefStreamEntry`](../../../core/objects/pdf-stream/type-aliases/PdfXRefStreamEntry.md) \| `undefined`

The xref entry or undefined if not found

---

### linkIndirectObjects()

> **linkIndirectObjects**(`objects`): `void`

Links xref entries to their corresponding indirect objects.
Updates byte offset references to point to actual object offsets.

#### Parameters

##### objects

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>[]

Array of indirect objects to link

#### Returns

`void`

---

### linkPrev()

> **linkPrev**(`objects`): `void`

Links this xref to a previous xref lookup based on the Prev trailer entry.

#### Parameters

##### objects

`PdfXrefLookup`[]

Array of xref lookups to search for the previous one

#### Returns

`void`

---

### removeObject()

> **removeObject**(`object`): `void`

Removes an indirect object from the xref lookup.
Also removes any trailer references to the object.

#### Parameters

##### object

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

The indirect object to remove

#### Returns

`void`

---

### reserveObjectNumbers()

> **reserveObjectNumbers**(`count`): `number`

Reserves a contiguous block of object numbers without registering objects.
Use this to pre-assign numbers to objects that will live inside an ObjStm.

#### Parameters

##### count

`number`

Number of object numbers to reserve

#### Returns

`number`

The first reserved object number

---

### setPrev()

> **setPrev**(`xref`): `void`

Links this xref to a previous xref lookup.
Copies missing trailer entries from the previous xref.

#### Parameters

##### xref

`PdfXrefLookup`

The previous xref lookup to link to

#### Returns

`void`

#### Throws

Error if trying to set self as previous (would create circular reference) or if offsets match (would create ambiguous or invalid xref chain)

---

### toTrailerSection()

> **toTrailerSection**(): [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Generates the trailer section objects for this xref.
Includes xref table/stream, trailer (if using table), startxref, and EOF.

#### Returns

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Array of objects forming the trailer section

---

### update()

> **update**(): [`PdfXRefTable`](../../../core/objects/pdf-xref-table/classes/PdfXRefTable.md) \| [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfXRefStream`](../../../core/objects/pdf-stream/classes/PdfXRefStream.md)\>

Updates the xref object with current entries.
Handles both table and stream formats, including hybrid documents.

#### Returns

[`PdfXRefTable`](../../../core/objects/pdf-xref-table/classes/PdfXRefTable.md) \| [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfXRefStream`](../../../core/objects/pdf-stream/classes/PdfXRefStream.md)\>

The updated xref object

---

### fromObjects()

> `static` **fromObjects**(`objects`): `PdfXrefLookup`

Creates xref lookups from an array of PDF objects.
Parses both xref tables and xref streams, linking them via the Prev chain.

#### Parameters

##### objects

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Array of PDF objects to parse

#### Returns

`PdfXrefLookup`

The most recent xref lookup with linked previous lookups

---

### fromXrefStream()

> `static` **fromXrefStream**(`streamObject`): `PdfXrefLookup`

Creates an xref lookup from an xref stream object.

#### Parameters

##### streamObject

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>\>

The indirect object containing the xref stream

#### Returns

`PdfXrefLookup`

A new PdfXrefLookup instance

---

### fromXrefTable()

> `static` **fromXrefTable**(`xrefTable`, `trailer`, `objects?`): `PdfXrefLookup`

Creates an xref lookup from a traditional xref table and trailer.
Handles hybrid xref documents with both table and stream entries.

#### Parameters

##### xrefTable

[`PdfXRefTable`](../../../core/objects/pdf-xref-table/classes/PdfXRefTable.md)

The xref table object

##### trailer

[`PdfTrailer`](../../../core/objects/pdf-trailer/classes/PdfTrailer.md)

The trailer object

##### objects?

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Optional array of objects for resolving hybrid xref streams

#### Returns

`PdfXrefLookup`

A new PdfXrefLookup instance
