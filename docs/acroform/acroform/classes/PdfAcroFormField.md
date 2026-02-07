[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [acroform/acroform](../README.md) / PdfAcroFormField

# Class: PdfAcroFormField

## Extends

- [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<\{ `AP?`: [`PdfAppearanceStreamDictionary`](../type-aliases/PdfAppearanceStreamDictionary.md); `AS?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md); `BS?`: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md); `DA?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md); `DV?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md) \| [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md); `F?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `Ff?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `FT`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<_typeof_ [`PdfFieldType`](../variables/PdfFieldType.md)\[keyof _typeof_ [`PdfFieldType`](../variables/PdfFieldType.md)\]\>; `Kids?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `MaxLen?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `MK?`: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md); `Opt?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md)\>; `P?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md); `Q?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `Rect?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md)\>; `Subtype?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"Widget"`\>; `T?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md); `Type?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"Annot"`\>; `V?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md) \| [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md); \}\>\>

## Constructors

### Constructor

> **new PdfAcroFormField**(`options?`): `PdfAcroFormField`

#### Parameters

##### options?

###### form?

[`PdfAcroForm`](PdfAcroForm.md)\<`Record`\<`string`, `string`\>\>

###### other?

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Returns

`PdfAcroFormField`

#### Overrides

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`constructor`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#constructor)

## Properties

### content

> **content**: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`content`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#content)

---

### defaultGenerateAppearance

> **defaultGenerateAppearance**: `boolean` = `true`

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`encryptable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`generationNumber`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`immutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`modified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`objectNumber`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`offset`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`orderIndex`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#orderindex)

---

### parent?

> `optional` **parent**: `PdfAcroFormField`

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`postTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`preTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`MAX_ORDER_INDEX`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#max_order_index)

## Accessors

### annotationFlags

#### Get Signature

> **get** **annotationFlags**(): `number`

Gets annotation flags (for visual appearance and behavior)

##### Returns

`number`

#### Set Signature

> **set** **annotationFlags**(`flags`): `void`

Sets annotation flags

##### Parameters

###### flags

`number`

##### Returns

`void`

---

### appearanceStreamDict

#### Get Signature

> **get** **appearanceStreamDict**(): [`PdfAppearanceStreamDictionary`](../type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

##### Returns

[`PdfAppearanceStreamDictionary`](../type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

#### Set Signature

> **set** **appearanceStreamDict**(`dict`): `void`

##### Parameters

###### dict

[`PdfAppearanceStreamDictionary`](../type-aliases/PdfAppearanceStreamDictionary.md) | `null`

##### Returns

`void`

---

### checked

#### Get Signature

> **get** **checked**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **checked**(`isChecked`): `void`

##### Parameters

###### isChecked

`boolean`

##### Returns

`void`

---

### comb

#### Get Signature

> **get** **comb**(): `boolean`

Checks if the field is a comb field (characters distributed evenly across cells)

##### Returns

`boolean`

---

### combField

#### Get Signature

> **get** **combField**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **combField**(`isComb`): `void`

##### Parameters

###### isComb

`boolean`

##### Returns

`void`

---

### combo

#### Get Signature

> **get** **combo**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **combo**(`isCombo`): `void`

##### Parameters

###### isCombo

`boolean`

##### Returns

`void`

---

### commitOnSelChange

#### Get Signature

> **get** **commitOnSelChange**(): `boolean`

If true, commit field value immediately on selection change (Ff bit 27)

##### Returns

`boolean`

#### Set Signature

> **set** **commitOnSelChange**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### defaultAppearance

#### Get Signature

> **get** **defaultAppearance**(): `string` \| `null`

##### Returns

`string` \| `null`

#### Set Signature

> **set** **defaultAppearance**(`da`): `void`

##### Parameters

###### da

`string`

##### Returns

`void`

---

### defaultValue

#### Get Signature

> **get** **defaultValue**(): `string`

Gets the default value

##### Returns

`string`

#### Set Signature

> **set** **defaultValue**(`val`): `void`

Sets the default value

##### Parameters

###### val

`string`

##### Returns

`void`

---

### doNotScroll

#### Get Signature

> **get** **doNotScroll**(): `boolean`

If true, do not scroll text field (Ff bit 24)

##### Returns

`boolean`

#### Set Signature

> **set** **doNotScroll**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### doNotSpellCheck

#### Get Signature

> **get** **doNotSpellCheck**(): `boolean`

If true, do not spell check this field (Ff bit 23)

##### Returns

`boolean`

#### Set Signature

> **set** **doNotSpellCheck**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### edit

#### Get Signature

> **get** **edit**(): `boolean`

If true, text field allows editing (Ff bit 19)

##### Returns

`boolean`

#### Set Signature

> **set** **edit**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### encodingMap

#### Get Signature

> **get** **encodingMap**(): `Map`\<`number`, `string`\> \| `undefined`

##### Returns

`Map`\<`number`, `string`\> \| `undefined`

---

### fieldType

#### Get Signature

> **get** **fieldType**(): `"Text"` \| `"Button"` \| `"Choice"` \| `"Signature"` \| `null`

Gets the field type

##### Returns

`"Text"` \| `"Button"` \| `"Choice"` \| `"Signature"` \| `null`

#### Set Signature

> **set** **fieldType**(`type`): `void`

##### Parameters

###### type

`"Text"` | `"Button"` | `"Choice"` | `"Signature"` | `null`

##### Returns

`void`

---

### flags

#### Get Signature

> **get** **flags**(): `number`

Gets field flags (bitwise combination of field attributes)

##### Returns

`number`

#### Set Signature

> **set** **flags**(`flags`): `void`

Sets field flags

##### Parameters

###### flags

`number`

##### Returns

`void`

---

### font

#### Set Signature

> **set** **font**(`font`): `void`

Sets the font using a PdfFont object.
Pass null to clear the font.

##### Parameters

###### font

[`PdfFont`](../../../fonts/pdf-font/classes/PdfFont.md) | `null`

##### Returns

`void`

---

### fontName

#### Get Signature

> **get** **fontName**(): `string` \| `null`

##### Returns

`string` \| `null`

#### Set Signature

> **set** **fontName**(`fontName`): `void`

##### Parameters

###### fontName

`string`

##### Returns

`void`

---

### fontSize

#### Get Signature

> **get** **fontSize**(): `number` \| `null`

##### Returns

`number` \| `null`

#### Set Signature

> **set** **fontSize**(`size`): `void`

##### Parameters

###### size

`number`

##### Returns

`void`

---

### hidden

#### Get Signature

> **get** **hidden**(): `boolean`

If true, the annotation is hidden (F bit 2)

##### Returns

`boolean`

#### Set Signature

> **set** **hidden**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### invisible

#### Get Signature

> **get** **invisible**(): `boolean`

If true, the annotation is invisible (F bit 1)

##### Returns

`boolean`

#### Set Signature

> **set** **invisible**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### isWidget

#### Get Signature

> **get** **isWidget**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **isWidget**(`isWidget`): `void`

##### Parameters

###### isWidget

`boolean`

##### Returns

`void`

---

### kids

#### Get Signature

> **get** **kids**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)[]

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)[]

#### Set Signature

> **set** **kids**(`kids`): `void`

##### Parameters

###### kids

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)[]

##### Returns

`void`

---

### locked

#### Get Signature

> **get** **locked**(): `boolean`

If true, annotation is locked (F bit 8)

##### Returns

`boolean`

#### Set Signature

> **set** **locked**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### maxLen

#### Get Signature

> **get** **maxLen**(): `number` \| `null`

##### Returns

`number` \| `null`

#### Set Signature

> **set** **maxLen**(`maxLen`): `void`

##### Parameters

###### maxLen

`number` | `null`

##### Returns

`void`

---

### multiline

#### Get Signature

> **get** **multiline**(): `boolean`

Checks if the field is multiline (for text fields)

##### Returns

`boolean`

#### Set Signature

> **set** **multiline**(`isMultiline`): `void`

Sets the field as multiline (for text fields)

##### Parameters

###### isMultiline

`boolean`

##### Returns

`void`

---

### multiSelect

#### Get Signature

> **get** **multiSelect**(): `boolean`

If true, allows multiple selections in choice field (Ff bit 22)

##### Returns

`boolean`

#### Set Signature

> **set** **multiSelect**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### name

#### Get Signature

> **get** **name**(): `string`

Gets the field name

##### Returns

`string`

#### Set Signature

> **set** **name**(`name`): `void`

Sets the field name

##### Parameters

###### name

`string`

##### Returns

`void`

---

### noExport

#### Get Signature

> **get** **noExport**(): `boolean`

If true, field value should not be exported (Ff bit 3)

##### Returns

`boolean`

#### Set Signature

> **set** **noExport**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### noRotate

#### Get Signature

> **get** **noRotate**(): `boolean`

If true, do not rotate annotation when rotating (F bit 5)

##### Returns

`boolean`

#### Set Signature

> **set** **noRotate**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### noToggleToOff

#### Get Signature

> **get** **noToggleToOff**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noToggleToOff**(`noToggle`): `void`

##### Parameters

###### noToggle

`boolean`

##### Returns

`void`

---

### noView

#### Get Signature

> **get** **noView**(): `boolean`

If true, do not display annotation on screen (F bit 6)

##### Returns

`boolean`

#### Set Signature

> **set** **noView**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### noZoom

#### Get Signature

> **get** **noZoom**(): `boolean`

If true, do not zoom annotation when zooming (F bit 4)

##### Returns

`boolean`

#### Set Signature

> **set** **noZoom**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`objectType`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#objecttype)

---

### options

#### Get Signature

> **get** **options**(): `string`[]

Gets the options for choice fields (dropdowns, list boxes).
Returns an array of option strings.

##### Returns

`string`[]

#### Set Signature

> **set** **options**(`options`): `void`

Sets the options for choice fields (dropdowns, list boxes).
Pass an array of strings.

##### Parameters

###### options

`string`[]

##### Returns

`void`

---

### parentRef

#### Get Signature

> **get** **parentRef**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) \| `null`

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) \| `null`

#### Set Signature

> **set** **parentRef**(`ref`): `void`

##### Parameters

###### ref

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) | `null`

##### Returns

`void`

---

### password

#### Get Signature

> **get** **password**(): `boolean`

Checks if the field is a password field (for text fields)

##### Returns

`boolean`

#### Set Signature

> **set** **password**(`isPassword`): `void`

Sets the field as a password field (for text fields)

##### Parameters

###### isPassword

`boolean`

##### Returns

`void`

---

### print

#### Get Signature

> **get** **print**(): `boolean`

If true, print the annotation when printing (F bit 3)

##### Returns

`boolean`

#### Set Signature

> **set** **print**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### pushButton

#### Get Signature

> **get** **pushButton**(): `boolean`

If true, field is a pushbutton (Ff bit 17)

##### Returns

`boolean`

#### Set Signature

> **set** **pushButton**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### quadding

#### Get Signature

> **get** **quadding**(): `number`

Gets the quadding (text alignment) for this field.
0 = left-justified, 1 = centered, 2 = right-justified

##### Returns

`number`

#### Set Signature

> **set** **quadding**(`q`): `void`

Sets the quadding (text alignment) for this field.
0 = left-justified, 1 = centered, 2 = right-justified

##### Parameters

###### q

`number`

##### Returns

`void`

---

### radio

#### Get Signature

> **get** **radio**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **radio**(`isRadio`): `void`

##### Parameters

###### isRadio

`boolean`

##### Returns

`void`

---

### readOnly

#### Get Signature

> **get** **readOnly**(): `boolean`

Checks if the field is read-only (Ff bit 1)

##### Returns

`boolean`

#### Set Signature

> **set** **readOnly**(`isReadOnly`): `void`

Sets the field as read-only or editable (Ff bit 1)

##### Parameters

###### isReadOnly

`boolean`

##### Returns

`void`

---

### rect

#### Get Signature

> **get** **rect**(): `number`[] \| `null`

##### Returns

`number`[] \| `null`

#### Set Signature

> **set** **rect**(`rect`): `void`

##### Parameters

###### rect

`number`[] | `null`

##### Returns

`void`

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`reference`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#reference)

---

### required

#### Get Signature

> **get** **required**(): `boolean`

Checks if the field is required

##### Returns

`boolean`

#### Set Signature

> **set** **required**(`isRequired`): `void`

Sets the field as required or optional

##### Parameters

###### isRequired

`boolean`

##### Returns

`void`

---

### sort

#### Get Signature

> **get** **sort**(): `boolean`

If true, choice options should be sorted alphabetically (Ff bit 20)

##### Returns

`boolean`

#### Set Signature

> **set** **sort**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### value

#### Get Signature

> **get** **value**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **value**(`val`): `void`

##### Parameters

###### val

`string` | [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md)

##### Returns

`void`

## Methods

### as()

> **as**\<`T`\>(`ctor`): `T`

Attempts to cast the object to a specific PdfObject subclass

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### ctor

(...`args`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`as`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`clone`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#clone)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`copyFrom`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#copyfrom)

---

### equals()

> **equals**(`other?`): `boolean`

Compares this object to another for equality based on their token representations

#### Parameters

##### other?

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`equals`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#equals)

---

### generateAppearance()

> **generateAppearance**(`options?`): `boolean`

Generates an appearance stream for a text field using iText's approach.

This generates an appearance with text using the same positioning formula as iText:

- textY = (height - fontSize) / 2 + fontSize \* 0.2
- Wrapped in marked content blocks (/Tx BMC ... EMC)
- Field remains editable unless makeReadOnly is set

For editable fields (default, no options):

- Text visible immediately
- Field remains fully editable
- No save dialog (needAppearances = false)
- Text positioning matches iText

For read-only fields (makeReadOnly: true):

- Same appearance generation
- Field is set as read-only

#### Parameters

##### options?

###### makeReadOnly?

`boolean`

If true, sets field as read-only

###### textYOffset?

`number`

#### Returns

`boolean`

true if appearance was generated successfully

---

### getAppearanceStream()

> **getAppearanceStream**(): [`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> \| `undefined`

**`Internal`**

Gets the stored appearance stream if one has been generated.
For button fields, returns the appropriate stream based on the current state.

#### Returns

[`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> \| `undefined`

---

### getAppearanceStreamsForWriting()

> **getAppearanceStreamsForWriting**(): \{ `primary`: [`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md); `secondary?`: [`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>; \} \| `undefined`

**`Internal`**

Gets all appearance streams for writing to PDF.
For button fields, returns both Off and Yes states.
For other fields, returns just the primary appearance.

#### Returns

\{ `primary`: [`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md); `secondary?`: [`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>; \} \| `undefined`

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`inPdf`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isEncryptable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isImmutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Convenience method to check if field dictionary is modified

#### Returns

`boolean`

#### Overrides

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isModified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`matchesReference`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`order`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#order)

---

### setAppearanceReference()

> **setAppearanceReference**(`appearanceStreamRef`, `appearanceStreamYesRef?`): `void`

**`Internal`**

Sets the appearance dictionary reference for this field.

- This is called automatically by PdfAcroForm.write()

#### Parameters

##### appearanceStreamRef

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### appearanceStreamYesRef?

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`void`

---

### setImmutable()

> **setImmutable**(`immutable?`): `void`

Sets the immutable state of the object

#### Parameters

##### immutable?

`boolean`

#### Returns

`void`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`setImmutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#setimmutable)

---

### setModified()

> **setModified**(`modified`): `void`

Sets the modified state of the object. Override this method if the modified state is determined differently

#### Parameters

##### modified

`boolean` = `true`

#### Returns

`void`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`setModified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#setmodified)

---

### toBytes()

> **toBytes**(`padTo?`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts the object to a ByteArray, optionally padding to a specified length

#### Parameters

##### padTo?

`number`

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toBytes`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`tokenize`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toString`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#totokens)

---

### createPlaceholder()

> `static` **createPlaceholder**\<`T`\>(`objectNumber?`, `generationNumber?`, `content?`): [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### objectNumber?

`number`

##### generationNumber?

`number`

##### content?

`T`

#### Returns

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`createPlaceholder`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#createplaceholder)
