[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/tokens/xref-table-section-start-token](../README.md) / PdfXRefTableSectionStartToken

# Class: PdfXRefTableSectionStartToken

## Extends

- [`PdfToken`](../../token/classes/PdfToken.md)

## Constructors

### Constructor

> **new PdfXRefTableSectionStartToken**(`start`, `count`): `PdfXRefTableSectionStartToken`

#### Parameters

##### start

`number` | [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

##### count

`number` | [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

#### Returns

`PdfXRefTableSectionStartToken`

#### Overrides

[`PdfToken`](../../token/classes/PdfToken.md).[`constructor`](../../token/classes/PdfToken.md#constructor)

## Properties

### count

> **count**: [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

---

### rawBytes

> `protected` **rawBytes**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`rawBytes`](../../token/classes/PdfToken.md#rawbytes)

---

### start

> **start**: [`PdfNumberToken`](../../number-token/classes/PdfNumberToken.md)

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

### clone()

> **clone**(): [`PdfToken`](../../token/classes/PdfToken.md)

#### Returns

[`PdfToken`](../../token/classes/PdfToken.md)

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`clone`](../../token/classes/PdfToken.md#clone)

---

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
