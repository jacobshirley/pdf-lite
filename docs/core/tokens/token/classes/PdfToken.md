[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/tokens/token](../README.md) / PdfToken

# Abstract Class: PdfToken

## Extended by

- [`PdfBooleanToken`](../../boolean-token/classes/PdfBooleanToken.md)
- [`PdfByteOffsetToken`](../../byte-offset-token/classes/PdfByteOffsetToken.md)
- [`PdfCommentToken`](../../comment-token/classes/PdfCommentToken.md)
- [`PdfEndArrayToken`](../../end-array-token/classes/PdfEndArrayToken.md)
- [`PdfEndDictionaryToken`](../../end-dictionary-token/classes/PdfEndDictionaryToken.md)
- [`PdfEndObjectToken`](../../end-object-token/classes/PdfEndObjectToken.md)
- [`PdfEndStreamToken`](../../end-stream-token/classes/PdfEndStreamToken.md)
- [`PdfHexadecimalToken`](../../hexadecimal-token/classes/PdfHexadecimalToken.md)
- [`PdfNameToken`](../../name-token/classes/PdfNameToken.md)
- [`PdfNullToken`](../../null-token/classes/PdfNullToken.md)
- [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)
- [`PdfObjectReferenceToken`](../../object-reference-token/classes/PdfObjectReferenceToken.md)
- [`PdfStartArrayToken`](../../start-array-token/classes/PdfStartArrayToken.md)
- [`PdfStartDictionaryToken`](../../start-dictionary-token/classes/PdfStartDictionaryToken.md)
- [`PdfStartObjectToken`](../../start-object-token/classes/PdfStartObjectToken.md)
- [`PdfStartStreamToken`](../../start-stream-token/classes/PdfStartStreamToken.md)
- [`PdfStartXRefToken`](../../start-xref-token/classes/PdfStartXRefToken.md)
- [`PdfStreamChunkToken`](../../stream-chunk-token/classes/PdfStreamChunkToken.md)
- [`PdfStringToken`](../../string-token/classes/PdfStringToken.md)
- [`PdfTrailerToken`](../../trailer-token/classes/PdfTrailerToken.md)
- [`PdfWhitespaceToken`](../../whitespace-token/classes/PdfWhitespaceToken.md)
- [`PdfXRefTableEntryToken`](../../xref-table-entry-token/classes/PdfXRefTableEntryToken.md)
- [`PdfXRefTableSectionStartToken`](../../xref-table-section-start-token/classes/PdfXRefTableSectionStartToken.md)
- [`PdfXRefTableStartToken`](../../xref-table-start-token/classes/PdfXRefTableStartToken.md)

## Constructors

### Constructor

> **new PdfToken**(`bytes?`): `PdfToken`

#### Parameters

##### bytes?

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`PdfToken`

## Properties

### rawBytes

> `protected` **rawBytes**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

## Accessors

### byteLength

#### Get Signature

> **get** **byteLength**(): `number`

##### Returns

`number`

---

### type

#### Get Signature

> **get** **type**(): `string`

##### Returns

`string`

## Methods

### equals()

> **equals**(`other`): `boolean`

#### Parameters

##### other

`PdfToken`

#### Returns

`boolean`

---

### toBytes()

> **toBytes**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

---

### toString()

> **toString**(): `string`

#### Returns

`string`
