[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/tokens/xref-table-entry-token](../README.md) / PdfXRefTableEntryToken

# Class: PdfXRefTableEntryToken

## Extends

- [`PdfToken`](../../token/classes/PdfToken.md)

## Constructors

### Constructor

> **new PdfXRefTableEntryToken**(`offset`, `generationNumber`, `objectNumber`, `inUse`): `PdfXRefTableEntryToken`

#### Parameters

##### offset

`number` | [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md) | [`Ref`](../../../ref/classes/Ref.md)\<`number`\>

##### generationNumber

`number` | [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

##### objectNumber

`number` | [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

##### inUse

`boolean`

#### Returns

`PdfXRefTableEntryToken`

#### Overrides

[`PdfToken`](../../token/classes/PdfToken.md).[`constructor`](../../token/classes/PdfToken.md#constructor)

## Properties

### generationNumber

> **generationNumber**: [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

---

### inUse

> **inUse**: `boolean`

---

### objectNumber

> **objectNumber**: [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

---

### offset

> **offset**: [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

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

#### Overrides

[`PdfToken`](../../token/classes/PdfToken.md).[`toBytes`](../../token/classes/PdfToken.md#tobytes)

---

### toString()

> **toString**(): `string`

#### Returns

`string`

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`toString`](../../token/classes/PdfToken.md#tostring)
