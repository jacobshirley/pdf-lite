[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/tokens/number-token](../README.md) / PdfNumberToken

# Class: PdfNumberToken

## Extends

- [`PdfToken`](../../token/classes/PdfToken.md)

## Constructors

### Constructor

> **new PdfNumberToken**(`options`, `padTo?`, `decimalPlaces?`): `PdfNumberToken`

#### Parameters

##### options

`number` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md) | \{ `decimalPlaces?`: `number`; `isByteToken?`: `boolean`; `padTo?`: `number`; `value`: `number` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md) \| [`Ref`](../../../ref/classes/Ref.md)\<`number`\> \| `PdfNumberToken`; \}

##### padTo?

`number`

##### decimalPlaces?

`number`

#### Returns

`PdfNumberToken`

#### Overrides

[`PdfToken`](../../token/classes/PdfToken.md).[`constructor`](../../token/classes/PdfToken.md#constructor)

## Properties

### decimalPlaces

> **decimalPlaces**: `number`

---

### isByteToken

> **isByteToken**: `boolean` = `false`

---

### padTo

> **padTo**: `number`

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

### ref

#### Get Signature

> **get** **ref**(): [`Ref`](../../../ref/classes/Ref.md)\<`number`\>

##### Returns

[`Ref`](../../../ref/classes/Ref.md)\<`number`\>

#### Set Signature

> **set** **ref**(`newRef`): `void`

##### Parameters

###### newRef

[`Ref`](../../../ref/classes/Ref.md)\<`number`\>

##### Returns

`void`

---

### type

#### Get Signature

> **get** **type**(): `string`

##### Returns

`string`

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`type`](../../token/classes/PdfToken.md#type)

---

### value

#### Get Signature

> **get** **value**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **value**(`newValue`): `void`

##### Parameters

###### newValue

`number`

##### Returns

`void`

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

#### Overrides

[`PdfToken`](../../token/classes/PdfToken.md).[`toBytes`](../../token/classes/PdfToken.md#tobytes)

---

### toString()

> **toString**(): `string`

#### Returns

`string`

#### Inherited from

[`PdfToken`](../../token/classes/PdfToken.md).[`toString`](../../token/classes/PdfToken.md#tostring)

---

### getDecimalPlaces()

> `static` **getDecimalPlaces**(`bytes`): `number`

#### Parameters

##### bytes

`number` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md) | [`Ref`](../../../ref/classes/Ref.md)\<`number`\> | `PdfNumberToken`

#### Returns

`number`

---

### getPadding()

> `static` **getPadding**(`bytes`): `number`

#### Parameters

##### bytes

`number` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md) | [`Ref`](../../../ref/classes/Ref.md)\<`number`\> | `PdfNumberToken`

#### Returns

`number`

---

### getValue()

> `static` **getValue**(`bytes`): [`Ref`](../../../ref/classes/Ref.md)\<`number`\>

#### Parameters

##### bytes

`number` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md) | [`Ref`](../../../ref/classes/Ref.md)\<`number`\> | `PdfNumberToken`

#### Returns

[`Ref`](../../../ref/classes/Ref.md)\<`number`\>

---

### toBytes()

> `static` **toBytes**(`value`, `padTo?`, `decimalPlaces?`): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Parameters

##### value

`number` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md) | [`Ref`](../../../ref/classes/Ref.md)\<`number`\> | `PdfNumberToken`

##### padTo?

`number`

##### decimalPlaces?

`number`

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)
