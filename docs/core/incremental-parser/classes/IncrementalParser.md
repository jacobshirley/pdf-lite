[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/incremental-parser](../README.md) / IncrementalParser

# Abstract Class: IncrementalParser\<I, O\>

Abstract base class for incremental parsers that can process input as it becomes available.
Supports buffering, lookahead, and backtracking for complex parsing scenarios.

## Extends

- [`Parser`](../../parser/classes/Parser.md)\<`I`, `O`\>

## Extended by

- [`PdfDecoder`](../../decoder/classes/PdfDecoder.md)
- [`PdfByteStreamTokeniser`](../../tokeniser/classes/PdfByteStreamTokeniser.md)

## Type Parameters

### I

`I`

The input item type

### O

`O`

The output item type

## Constructors

### Constructor

> **new IncrementalParser**\<`I`, `O`\>(): `IncrementalParser`\<`I`, `O`\>

#### Returns

`IncrementalParser`\<`I`, `O`\>

#### Inherited from

[`Parser`](../../parser/classes/Parser.md).[`constructor`](../../parser/classes/Parser.md#constructor)

## Properties

### buffer

> `protected` **buffer**: `I`[] = `[]`

Buffer holding input items

---

### bufferIndex

> `protected` **bufferIndex**: `number` = `0`

Current position in the buffer

---

### eof

> **eof**: `boolean` = `false`

Whether end of file has been signaled

---

### inputOffset

> `protected` **inputOffset**: `number` = `0`

Current position in the input stream

---

### outputOffset

> `protected` **outputOffset**: `number` = `0`

Number of outputs generated

## Methods

### atEof()

> `protected` **atEof**(): `boolean`

Checks if end of file has been reached and buffer is exhausted.

#### Returns

`boolean`

True if no more input is available

---

### canCompact()

> `protected` **canCompact**(): `boolean`

Override to customize when to compact the buffer
By default, compacts when more than 1000 items have been consumed

#### Returns

`boolean`

boolean indicating whether to compact the buffer

---

### compact()

> `protected` **compact**(): `void`

Compacts the buffer by removing consumed items

#### Returns

`void`

---

### expect()

> `protected` **expect**\<`T`\>(`itemType`): `T`

Consumes and validates the next item against an expected type or value.

#### Type Parameters

##### T

`T`

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

---

### feed()

> **feed**(...`input`): `void`

Feeds input items into the parser buffer.

#### Parameters

##### input

...(`I` \| `I`[])[]

Input items to add to the buffer

#### Returns

`void`

#### Overrides

[`Parser`](../../parser/classes/Parser.md).[`feed`](../../parser/classes/Parser.md#feed)

---

### next()

> `protected` **next**(): `I`

Consumes and returns the next item from the buffer.

#### Returns

`I`

The next item

#### Throws

NoMoreTokensError if more input is needed and EOF not signaled

#### Throws

EofReachedError if at EOF and no more items available

---

### nextItems()

> **nextItems**(): `Generator`\<`O`\>

Generates parsed output items from the buffer.
Handles backtracking when more input is needed.

#### Returns

`Generator`\<`O`\>

A generator yielding parsed output items

#### Overrides

[`Parser`](../../parser/classes/Parser.md).[`nextItems`](../../parser/classes/Parser.md#nextitems)

---

### oneOf()

> `protected` **oneOf**(...`fn`): `O`

Tries multiple parsing functions and returns the first successful result.
Automatically backtracks on failure.

#### Parameters

##### fn

...() => `O`[]

Array of parsing functions to try

#### Returns

`O`

The result from the first successful parsing function

#### Throws

NoMoreTokensError if any function needs more input

#### Throws

Error if all parsing functions fail

---

### parse()

> `abstract` `protected` **parse**(): `O`

Abstract method to parse the next output item from the buffer.
Subclasses must implement this to define parsing logic.

#### Returns

`O`

The parsed output item

---

### peek()

> `protected` **peek**(`ahead`): `I` \| `null`

Peeks at an item in the buffer without consuming it.

#### Parameters

##### ahead

`number` = `0`

Number of positions to look ahead (default: 0)

#### Returns

`I` \| `null`

The item at the peek position, or null if at EOF

#### Throws

NoMoreTokensError if more input is needed and EOF not signaled
