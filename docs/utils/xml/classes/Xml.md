[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/xml](../README.md) / Xml

# Class: Xml

## Constructors

### Constructor

> **new Xml**(): `Xml`

#### Returns

`Xml`

## Methods

### escapeRegex()

> `static` **escapeRegex**(`str`): `string`

#### Parameters

##### str

`string`

#### Returns

`string`

---

### escapeValue()

> `static` **escapeValue**(`value`): `string`

#### Parameters

##### value

`string`

#### Returns

`string`

---

### getElementContent()

> `static` **getElementContent**(`xml`, `tagName`): `string` \| `null`

#### Parameters

##### xml

`string`

##### tagName

`string`

#### Returns

`string` \| `null`

---

### hasElement()

> `static` **hasElement**(`xml`, `tagName`): `boolean`

#### Parameters

##### xml

`string`

##### tagName

`string`

#### Returns

`boolean`

---

### insertChild()

> `static` **insertChild**(`xml`, `parentTagName`, `childXml`): `string`

#### Parameters

##### xml

`string`

##### parentTagName

`string`

##### childXml

`string`

#### Returns

`string`

---

### setElementContent()

> `static` **setElementContent**(`xml`, `tagName`, `content`): `string`

#### Parameters

##### xml

`string`

##### tagName

`string`

##### content

`string`

#### Returns

`string`

---

### wrapInElements()

> `static` **wrapInElements**(`content`, `tagNames`): `string`

#### Parameters

##### content

`string`

##### tagNames

`string`[]

#### Returns

`string`
