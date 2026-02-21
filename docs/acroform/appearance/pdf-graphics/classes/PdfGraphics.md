[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/appearance/pdf-graphics](../README.md) / PdfGraphics

# Class: PdfGraphics

Lightweight builder for PDF content streams.
Chains PDF operators via a fluent API and emits the final stream with build().
Enhanced with text measurement capabilities for layout calculations.

## Constructors

### Constructor

> **new PdfGraphics**(`options?`): `PdfGraphics`

#### Parameters

##### options?

###### defaultAppearance?

[`PdfDefaultAppearance`](../../../fields/pdf-default-appearance/classes/PdfDefaultAppearance.md)

###### resolvedFonts?

`Map`\<`string`, [`PdfFont`](../../../../fonts/pdf-font/classes/PdfFont.md)\>

#### Returns

`PdfGraphics`

## Methods

### beginMarkedContent()

> **beginMarkedContent**(): `this`

#### Returns

`this`

---

### beginText()

> **beginText**(): `this`

#### Returns

`this`

---

### build()

> **build**(): `string`

#### Returns

`string`

---

### calculateFittingFontSize()

> **calculateFittingFontSize**(`text`, `maxWidth`, `maxHeight?`, `lineHeight?`): `number`

Calculate the minimum font size needed to fit text within given constraints.

#### Parameters

##### text

`string`

##### maxWidth

`number`

##### maxHeight?

`number`

##### lineHeight?

`number` = `1.2`

#### Returns

`number`

---

### closePath()

> **closePath**(): `this`

#### Returns

`this`

---

### curveTo()

> **curveTo**(`x1`, `y1`, `x2`, `y2`, `x3`, `y3`): `this`

#### Parameters

##### x1

`number`

##### y1

`number`

##### x2

`number`

##### y2

`number`

##### x3

`number`

##### y3

`number`

#### Returns

`this`

---

### endMarkedContent()

> **endMarkedContent**(): `this`

#### Returns

`this`

---

### endText()

> **endText**(): `this`

#### Returns

`this`

---

### fill()

> **fill**(): `this`

#### Returns

`this`

---

### lineTo()

> **lineTo**(`x`, `y`): `this`

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`this`

---

### measureTextWidth()

> **measureTextWidth**(`text`, `fontSize?`): `number`

Calculate the width of text using the current font and size.

#### Parameters

##### text

`string`

##### fontSize?

`number`

#### Returns

`number`

---

### movePath()

> **movePath**(`x`, `y`): `this`

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`this`

---

### moveTo()

> **moveTo**(`x`, `y`): `this`

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`this`

---

### raw()

> **raw**(`op`): `this`

#### Parameters

##### op

`string`

#### Returns

`this`

---

### restore()

> **restore**(): `this`

#### Returns

`this`

---

### save()

> **save**(): `this`

#### Returns

`this`

---

### setDefaultAppearance()

> **setDefaultAppearance**(`da`): `this`

#### Parameters

##### da

[`PdfDefaultAppearance`](../../../fields/pdf-default-appearance/classes/PdfDefaultAppearance.md)

#### Returns

`this`

---

### setFillGray()

> **setFillGray**(`v`): `this`

#### Parameters

##### v

`number`

#### Returns

`this`

---

### setFillRGB()

> **setFillRGB**(`r`, `g`, `b`): `this`

#### Parameters

##### r

`number`

##### g

`number`

##### b

`number`

#### Returns

`this`

---

### setFont()

> **setFont**(`name`, `size`): `this`

#### Parameters

##### name

`string`

##### size

`number`

#### Returns

`this`

---

### showLiteralText()

> **showLiteralText**(`text`): `this`

#### Parameters

##### text

`string`

#### Returns

`this`

---

### showText()

> **showText**(`text`, `isUnicode`, `reverseEncodingMap?`): `this`

#### Parameters

##### text

`string`

##### isUnicode

`boolean`

##### reverseEncodingMap?

`Map`\<`string`, `number`\>

#### Returns

`this`

---

### stroke()

> **stroke**(): `this`

#### Returns

`this`

---

### wrapTextToLines()

> **wrapTextToLines**(`text`, `maxWidth`, `fontSize?`): `string`[]

Wrap text to fit within the specified width, breaking at word boundaries.

#### Parameters

##### text

`string`

##### maxWidth

`number`

##### fontSize?

`number`

#### Returns

`string`[]
