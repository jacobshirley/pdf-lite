[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/tokeniser](../README.md) / PdfObjectTokeniser

# Class: PdfObjectTokeniser

Tokenizes PDF objects into a stream of PDF tokens.

## Extends

- [`Parser`](../../parser/parser/classes/Parser.md)\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md), [`PdfToken`](../../tokens/token/classes/PdfToken.md)\>

## Constructors

### Constructor

> **new PdfObjectTokeniser**(): `PdfObjectTokeniser`

#### Returns

`PdfObjectTokeniser`

#### Inherited from

[`Parser`](../../parser/parser/classes/Parser.md).[`constructor`](../../parser/parser/classes/Parser.md#constructor)

## Methods

### feed()

> **feed**(...`input`): `void`

Feeds PDF objects into the tokenizer buffer.

#### Parameters

##### input

...[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)[]

PDF objects to tokenize

#### Returns

`void`

#### Overrides

[`Parser`](../../parser/parser/classes/Parser.md).[`feed`](../../parser/parser/classes/Parser.md#feed)

---

### nextItems()

> **nextItems**(): `Generator`\<[`PdfToken`](../../tokens/token/classes/PdfToken.md)\>

Generates tokens from the buffered PDF objects.

#### Returns

`Generator`\<[`PdfToken`](../../tokens/token/classes/PdfToken.md)\>

A generator yielding PDF tokens

#### Overrides

[`Parser`](../../parser/parser/classes/Parser.md).[`nextItems`](../../parser/parser/classes/Parser.md#nextitems)
