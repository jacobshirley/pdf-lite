[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/serializer](../README.md) / PdfTokenSerializer

# Class: PdfTokenSerializer

Serializes PDF tokens into a byte stream.
Handles byte offset calculation and token serialization.

## Extends

- [`Parser`](../../parser/parser/classes/Parser.md)\<[`PdfToken`](../../tokens/token/classes/PdfToken.md), `number`\>

## Constructors

### Constructor

> **new PdfTokenSerializer**(): `PdfTokenSerializer`

#### Returns

`PdfTokenSerializer`

#### Inherited from

[`Parser`](../../parser/parser/classes/Parser.md).[`constructor`](../../parser/parser/classes/Parser.md#constructor)

## Properties

### offset

> **offset**: `number` = `0`

Current byte offset in the output stream

## Methods

### calculateOffsets()

> **calculateOffsets**(): `void`

Pre-calculates byte offsets for all byte offset tokens in the buffer.
Does not consume the buffer.

#### Returns

`void`

---

### feed()

> **feed**(...`input`): `void`

Feeds tokens into the serializer buffer.

#### Parameters

##### input

...[`PdfToken`](../../tokens/token/classes/PdfToken.md)[]

PDF tokens to serialize

#### Returns

`void`

#### Overrides

[`Parser`](../../parser/parser/classes/Parser.md).[`feed`](../../parser/parser/classes/Parser.md#feed)

---

### feedMany()

> **feedMany**(`tokens`): `void`

Efficiently feeds many tokens into the serializer buffer at once.
Use this instead of spreading large arrays to avoid stack overflow.

#### Parameters

##### tokens

[`PdfToken`](../../tokens/token/classes/PdfToken.md)[]

Array of PDF tokens to serialize

#### Returns

`void`

---

### nextItems()

> **nextItems**(): `Generator`\<`number`\>

Generates bytes from the buffered tokens.
Updates byte offset tokens as they are encountered.

#### Returns

`Generator`\<`number`\>

A generator yielding individual bytes

#### Overrides

[`Parser`](../../parser/parser/classes/Parser.md).[`nextItems`](../../parser/parser/classes/Parser.md#nextitems)

---

### toBytes()

> **toBytes**(): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Serializes all buffered tokens to a byte array.

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The serialized PDF as a Uint8Array
