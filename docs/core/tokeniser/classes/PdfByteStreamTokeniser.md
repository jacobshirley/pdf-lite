[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/tokeniser](../README.md) / PdfByteStreamTokeniser

# Class: PdfByteStreamTokeniser

Tokenizes a byte stream into PDF tokens.
Handles all PDF syntax including objects, streams, and xref tables.

## Extends

- [`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md)\<`number`, [`PdfToken`](../../tokens/token/classes/PdfToken.md)\>

## Constructors

### Constructor

> **new PdfByteStreamTokeniser**(`options?`): `PdfByteStreamTokeniser`

Creates a new byte stream tokenizer.

#### Parameters

##### options?

Configuration options

###### streamChunkSizeBytes?

`number`

Size of stream chunks (default: 1024)

#### Returns

`PdfByteStreamTokeniser`

#### Overrides

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`constructor`](../../parser/incremental-parser/classes/IncrementalParser.md#constructor)

## Properties

### buffer

> `protected` **buffer**: `number`[] = `[]`

Buffer holding input items

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`buffer`](../../parser/incremental-parser/classes/IncrementalParser.md#buffer)

---

### bufferIndex

> `protected` **bufferIndex**: `number` = `0`

Current position in the buffer

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`bufferIndex`](../../parser/incremental-parser/classes/IncrementalParser.md#bufferindex)

---

### eof

> **eof**: `boolean` = `false`

Whether end of file has been signaled

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`eof`](../../parser/incremental-parser/classes/IncrementalParser.md#eof)

---

### inputOffset

> `protected` **inputOffset**: `number` = `0`

Current position in the input stream

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`inputOffset`](../../parser/incremental-parser/classes/IncrementalParser.md#inputoffset)

---

### outputOffset

> `protected` **outputOffset**: `number` = `0`

Number of outputs generated

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`outputOffset`](../../parser/incremental-parser/classes/IncrementalParser.md#outputoffset)

## Methods

### atEof()

> `protected` **atEof**(): `boolean`

Checks if end of file has been reached and buffer is exhausted.

#### Returns

`boolean`

True if no more input is available

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`atEof`](../../parser/incremental-parser/classes/IncrementalParser.md#ateof)

---

### canCompact()

> `protected` **canCompact**(): `boolean`

Override to customize when to compact the buffer
By default, compacts when more than 1000 items have been consumed

#### Returns

`boolean`

boolean indicating whether to compact the buffer

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`canCompact`](../../parser/incremental-parser/classes/IncrementalParser.md#cancompact)

---

### compact()

> `protected` **compact**(): `void`

Compacts the buffer by removing consumed items

#### Returns

`void`

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`compact`](../../parser/incremental-parser/classes/IncrementalParser.md#compact)

---

### expect()

> `protected` **expect**\<`T`\>(`itemType`): `T`

Consumes and validates the next item against an expected type or value.

#### Type Parameters

##### T

`T` _extends_ `number`

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

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`expect`](../../parser/incremental-parser/classes/IncrementalParser.md#expect)

---

### feed()

> **feed**(...`input`): `void`

Feeds input items into the parser buffer.

#### Parameters

##### input

...(`number` \| `number`[])[]

Input items to add to the buffer

#### Returns

`void`

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`feed`](../../parser/incremental-parser/classes/IncrementalParser.md#feed)

---

### feedBytes()

> **feedBytes**(`bytes`): `void`

Feeds a byte array into the tokenizer.

#### Parameters

##### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The bytes to process

#### Returns

`void`

---

### next()

> `protected` **next**(): `number`

Consumes and returns the next item from the buffer.

#### Returns

`number`

The next item

#### Throws

NoMoreTokensError if more input is needed and EOF not signaled

#### Throws

EofReachedError if at EOF and no more items available

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`next`](../../parser/incremental-parser/classes/IncrementalParser.md#next)

---

### nextItems()

> **nextItems**(): `Generator`\<[`PdfToken`](../../tokens/token/classes/PdfToken.md)\>

Generates parsed output items from the buffer.
Handles backtracking when more input is needed.

#### Returns

`Generator`\<[`PdfToken`](../../tokens/token/classes/PdfToken.md)\>

A generator yielding parsed output items

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`nextItems`](../../parser/incremental-parser/classes/IncrementalParser.md#nextitems)

---

### oneOf()

> `protected` **oneOf**(...`fn`): [`PdfToken`](../../tokens/token/classes/PdfToken.md)

Tries multiple parsing functions and returns the first successful result.
Automatically backtracks on failure.

#### Parameters

##### fn

...() => [`PdfToken`](../../tokens/token/classes/PdfToken.md)[]

Array of parsing functions to try

#### Returns

[`PdfToken`](../../tokens/token/classes/PdfToken.md)

The result from the first successful parsing function

#### Throws

NoMoreTokensError if any function needs more input

#### Throws

Error if all parsing functions fail

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`oneOf`](../../parser/incremental-parser/classes/IncrementalParser.md#oneof)

---

### parse()

> `protected` **parse**(): [`PdfToken`](../../tokens/token/classes/PdfToken.md)

Abstract method to parse the next output item from the buffer.
Subclasses must implement this to define parsing logic.

#### Returns

[`PdfToken`](../../tokens/token/classes/PdfToken.md)

The parsed output item

#### Overrides

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`parse`](../../parser/incremental-parser/classes/IncrementalParser.md#parse)

---

### peek()

> `protected` **peek**(`ahead`): `number` \| `null`

Peeks at an item in the buffer without consuming it.

#### Parameters

##### ahead

`number` = `0`

Number of positions to look ahead (default: 0)

#### Returns

`number` \| `null`

The item at the peek position, or null if at EOF

#### Throws

NoMoreTokensError if more input is needed and EOF not signaled

#### Inherited from

[`IncrementalParser`](../../parser/incremental-parser/classes/IncrementalParser.md).[`peek`](../../parser/incremental-parser/classes/IncrementalParser.md#peek)
