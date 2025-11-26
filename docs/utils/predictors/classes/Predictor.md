[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/predictors](../README.md) / Predictor

# Class: Predictor

Handles PNG and TIFF predictor encoding and decoding for PDF streams.
Predictors are used to improve compression efficiency by transforming
image data before or after compression.

## Constructors

### Constructor

> **new Predictor**(): `Predictor`

#### Returns

`Predictor`

## Methods

### canHandleDecodeParms()

> `static` **canHandleDecodeParms**(`decodeParms?`): `boolean`

Checks if the decode parameters can be handled by this predictor.

#### Parameters

##### decodeParms?

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>

Optional PDF dictionary containing decode parameters.

#### Returns

`boolean`

True if the parameters can be handled, false otherwise.

#### Example

```typescript
if (Predictor.canHandleDecodeParms(dictionary)) {
    // Process with predictor
}
```

---

### decode()

> `static` **decode**(`data`, `params`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Decodes data that was encoded with a predictor.

#### Parameters

##### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The encoded data to decode.

##### params

[`DecodeParms`](../../../types/type-aliases/DecodeParms.md) = `{}`

Optional decode parameters including Predictor, Columns, Colors, and BitsPerComponent.

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The decoded byte array.

#### Example

```typescript
const decoded = Predictor.decode(encodedData, { Predictor: 12, Columns: 100 })
```

---

### encode()

> `static` **encode**(`data`, `params`, `PdfStreamFilterType`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Encodes data using a predictor algorithm.

#### Parameters

##### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to encode.

##### params

[`DecodeParms`](../../../types/type-aliases/DecodeParms.md) = `{}`

Optional encode parameters including Predictor, Columns, Colors, and BitsPerComponent.

##### PdfStreamFilterType

`number` = `0`

The PNG filter type to use for encoding.

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The encoded byte array.

#### Example

```typescript
const encoded = Predictor.encode(rawData, { Predictor: 12, Columns: 100 }, 1)
```

---

### getDecodeParms()

> `static` **getDecodeParms**(`decodeParms?`): [`DecodeParms`](../../../types/type-aliases/DecodeParms.md) \| `null`

Extracts decode parameters from a PDF dictionary.

#### Parameters

##### decodeParms?

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>

Optional PDF dictionary containing decode parameters.

#### Returns

[`DecodeParms`](../../../types/type-aliases/DecodeParms.md) \| `null`

The decode parameters object or null if not applicable.

#### Example

```typescript
const params = Predictor.getDecodeParms(dictionary)
if (params) {
    console.log(params.Predictor)
}
```

---

### pngDecode()

> `static` **pngDecode**(`data`, `columns`, `bpp`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Decodes PNG predictor encoded data.

#### Parameters

##### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The PNG encoded data.

##### columns

`number`

The number of columns in the image.

##### bpp

`number`

Bytes per pixel.

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The decoded byte array.

#### Throws

Error if an unsupported PNG filter type is encountered.

---

### pngEncode()

> `static` **pngEncode**(`data`, `columns`, `bpp`, `PdfStreamFilterType`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Encodes data using PNG predictor.

#### Parameters

##### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to encode.

##### columns

`number`

The number of columns in the image.

##### bpp

`number`

Bytes per pixel.

##### PdfStreamFilterType

`number`

The PNG filter type (0-4) to use.

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The PNG encoded byte array.

#### Throws

Error if an unsupported PNG filter type is specified.

---

### tiffDecode()

> `static` **tiffDecode**(`data`, `columns`, `bpp`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Decodes TIFF predictor encoded data.

#### Parameters

##### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The TIFF encoded data.

##### columns

`number`

The number of columns in the image.

##### bpp

`number`

Bytes per pixel.

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The decoded byte array.

---

### tiffEncode()

> `static` **tiffEncode**(`data`, `columns`, `bpp`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Encodes data using TIFF predictor.

#### Parameters

##### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to encode.

##### columns

`number`

The number of columns in the image.

##### bpp

`number`

Bytes per pixel.

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The TIFF encoded byte array.
