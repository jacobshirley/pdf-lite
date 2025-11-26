[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/tokens/start-object-token](../README.md) / PdfStartObjectToken

# Class: PdfStartObjectToken

## Extends

- [`PdfToken`](../../token/classes/PdfToken.md)

## Constructors

### Constructor

> **new PdfStartObjectToken**(`objectNumber`, `generationNumber`, `byteOffset?`): `PdfStartObjectToken`

#### Parameters

##### objectNumber

`number`

##### generationNumber

`number`

##### byteOffset?

`number`

#### Returns

`PdfStartObjectToken`

#### Overrides

[`PdfToken`](../../token/classes/PdfToken.md).[`constructor`](../../token/classes/PdfToken.md#constructor)

## Properties

### byteOffset?

> `optional` **byteOffset**: `number`

---

### generationNumber

> **generationNumber**: `number`

---

### objectNumber

> **objectNumber**: `number`

---

### rawBytes

> `protected` **rawBytes**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`rawBytes`](../../token/classes/PdfToken.md#rawbytes)

## Accessors

### byteLength

#### Get Signature

> **get** **byteLength**(): `number`

##### Returns

`number`

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`byteLength`](../../token/classes/PdfToken.md#bytelength)

---

### type

#### Get Signature

> **get** **type**(): `string`

##### Returns

`string`

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`type`](../../token/classes/PdfToken.md#type)

## Methods

### equals()

> **equals**(`other`): `boolean`

#### Parameters

##### other

[`PdfToken`](../../token/classes/PdfToken.md)

#### Returns

`boolean`

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`equals`](../../token/classes/PdfToken.md#equals)

---

### toBytes()

> **toBytes**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`toBytes`](../../token/classes/PdfToken.md#tobytes)

---

### toString()

> **toString**(): `string`

#### Returns

`string`

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`toString`](../../token/classes/PdfToken.md#tostring)
