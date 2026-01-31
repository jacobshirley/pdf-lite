[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [xfa/manager](../README.md) / PdfXfaManager

# Class: PdfXfaManager

Manages XFA (XML Forms Architecture) forms in PDF documents.
Provides methods to read and write XFA form data as XML.

## Constructors

### Constructor

> **new PdfXfaManager**(`document`): `PdfXfaManager`

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

#### Returns

`PdfXfaManager`

## Methods

### hasXfaForms()

> **hasXfaForms**(): `Promise`\<`boolean`\>

Checks if the document contains XFA forms.

#### Returns

`Promise`\<`boolean`\>

True if the document has XFA forms, false otherwise

---

### readXml()

> **readXml**(): `Promise`\<`string` \| `null`\>

Reads the XFA form data as XML string.

#### Returns

`Promise`\<`string` \| `null`\>

The XFA datasets XML content, or null if no XFA form exists

---

### writeXml()

> **writeXml**(`xml`): `Promise`\<`void`\>

Writes XML content to the XFA datasets stream.

#### Parameters

##### xml

`string`

The XML content to write

#### Returns

`Promise`\<`void`\>

#### Throws

Error if the document doesn't have XFA forms
