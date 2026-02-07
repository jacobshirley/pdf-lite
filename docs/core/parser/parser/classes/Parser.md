[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/parser/parser](../README.md) / Parser

# Abstract Class: Parser\<I, O\>

Abstract base class for parsers that transform input items to output items.
Provides a common interface for feeding input and generating output.

## Extended by

- [`PdfTokenSerializer`](../../../serializer/classes/PdfTokenSerializer.md)
- [`PdfObjectTokeniser`](../../../tokeniser/classes/PdfObjectTokeniser.md)
- [`IncrementalParser`](../../incremental-parser/classes/IncrementalParser.md)

## Type Parameters

### I

`I`

The input item type

### O

`O`

The output item type

## Constructors

### Constructor

> **new Parser**\<`I`, `O`\>(): `Parser`\<`I`, `O`\>

#### Returns

`Parser`\<`I`, `O`\>

## Methods

### feed()

> `abstract` **feed**(...`input`): `void`

Feeds input items to the parser.

#### Parameters

##### input

...`I`[]

Input items to process

#### Returns

`void`

---

### nextItems()

> `abstract` **nextItems**(): `Generator`\<`O`\>

Generates output items from the fed input.

#### Returns

`Generator`\<`O`\>

A generator yielding output items
