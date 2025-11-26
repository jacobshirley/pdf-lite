[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/decoder](../README.md) / PdfDecoder

# Class: PdfDecoder

Decodes PDF tokens into PDF objects.
Handles parsing of all PDF object types including dictionaries, arrays, streams, and xref tables.

## Extends

- [`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md)\<[`PdfToken`](../../tokens/token/classes/PdfToken.md), [`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)\>

## Constructors

### Constructor

> **new PdfDecoder**(`options?`): `PdfDecoder`

Creates a new PDF decoder.

#### Parameters

##### options?

Configuration options

###### ignoreWhitespace?

`boolean`

If true, whitespace tokens are ignored

###### maxBufferSizeBytes?

`number`

Maximum buffer size before compaction (default: 10MB)

#### Returns

`PdfDecoder`

#### Overrides

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`constructor`](../../incremental-parser/classes/IncrementalParser.md#constructor)

## Properties

### buffer

> `protected` **buffer**: [`PdfToken`](../../tokens/token/classes/PdfToken.md)[] = `[]`

Buffer holding input items

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`buffer`](../../incremental-parser/classes/IncrementalParser.md#buffer)

---

### bufferIndex

> `protected` **bufferIndex**: `number` = `0`

Current position in the buffer

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`bufferIndex`](../../incremental-parser/classes/IncrementalParser.md#bufferindex)

---

### eof

> **eof**: `boolean` = `false`

Whether end of file has been signaled

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`eof`](../../incremental-parser/classes/IncrementalParser.md#eof)

---

### inputOffset

> `protected` **inputOffset**: `number` = `0`

Current position in the input stream

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`inputOffset`](../../incremental-parser/classes/IncrementalParser.md#inputoffset)

---

### outputOffset

> `protected` **outputOffset**: `number` = `0`

Number of outputs generated

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`outputOffset`](../../incremental-parser/classes/IncrementalParser.md#outputoffset)

## Methods

### atEof()

> `protected` **atEof**(): `boolean`

Checks if end of file has been reached and buffer is exhausted.

#### Returns

`boolean`

True if no more input is available

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`atEof`](../../incremental-parser/classes/IncrementalParser.md#ateof)

---

### bufferSize()

> `protected` **bufferSize**(): `number`

#### Returns

`number`

---

### canCompact()

> `protected` **canCompact**(): `boolean`

Override to customize when to compact the buffer
By default, compacts when more than 1000 items have been consumed

#### Returns

`boolean`

boolean indicating whether to compact the buffer

#### Overrides

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`canCompact`](../../incremental-parser/classes/IncrementalParser.md#cancompact)

---

### compact()

> `protected` **compact**(): `void`

Compacts the buffer by removing consumed items

#### Returns

`void`

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`compact`](../../incremental-parser/classes/IncrementalParser.md#compact)

---

### expect()

> `protected` **expect**\<`T`\>(`itemType`): `T`

Consumes and validates the next item against an expected type or value.

#### Type Parameters

##### T

`T` _extends_ [`PdfToken`](../../tokens/token/classes/PdfToken.md)

The expected item type

#### Parameters

##### itemType

Constructor or value to match against

`T` | (...`args`) => `T`

#### Returns

`T`

The consumed item cast to the expected type

#### Throws

Error if the item doesn't match the expected type/value

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`expect`](../../incremental-parser/classes/IncrementalParser.md#expect)

---

### feed()

> **feed**(...`input`): `void`

Feeds input items into the parser buffer.

#### Parameters

##### input

...([`PdfToken`](../../tokens/token/classes/PdfToken.md) \| [`PdfToken`](../../tokens/token/classes/PdfToken.md)[])[]

Input items to add to the buffer

#### Returns

`void`

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`feed`](../../incremental-parser/classes/IncrementalParser.md#feed)

---

### next()

> `protected` **next**(): [`PdfToken`](../../tokens/token/classes/PdfToken.md)

Consumes and returns the next item from the buffer.

#### Returns

[`PdfToken`](../../tokens/token/classes/PdfToken.md)

The next item

#### Throws

NoMoreTokensError if more input is needed and EOF not signaled

#### Throws

EofReachedError if at EOF and no more items available

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`next`](../../incremental-parser/classes/IncrementalParser.md#next)

---

### nextItems()

> **nextItems**(): `Generator`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)\>

Generates parsed output items from the buffer.
Handles backtracking when more input is needed.

#### Returns

`Generator`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)\>

A generator yielding parsed output items

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`nextItems`](../../incremental-parser/classes/IncrementalParser.md#nextitems)

---

### oneOf()

> `protected` **oneOf**(...`fn`): [`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)

Tries multiple parsing functions and returns the first successful result.
Automatically backtracks on failure.

#### Parameters

##### fn

...() => [`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)[]

Array of parsing functions to try

#### Returns

[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)

The result from the first successful parsing function

#### Throws

NoMoreTokensError if any function needs more input

#### Throws

Error if all parsing functions fail

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`oneOf`](../../incremental-parser/classes/IncrementalParser.md#oneof)

---

### parse()

> `protected` **parse**(): [`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)

Abstract method to parse the next output item from the buffer.
Subclasses must implement this to define parsing logic.

#### Returns

[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)

The parsed output item

#### Overrides

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`parse`](../../incremental-parser/classes/IncrementalParser.md#parse)

---

### peek()

> `protected` **peek**(`ahead`): [`PdfToken`](../../tokens/token/classes/PdfToken.md) \| `null`

Peeks at an item in the buffer without consuming it.

#### Parameters

##### ahead

`number` = `0`

Number of positions to look ahead (default: 0)

#### Returns

[`PdfToken`](../../tokens/token/classes/PdfToken.md) \| `null`

The item at the peek position, or null if at EOF

#### Throws

NoMoreTokensError if more input is needed and EOF not signaled

#### Inherited from

[`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md).[`peek`](../../incremental-parser/classes/IncrementalParser.md#peek)
