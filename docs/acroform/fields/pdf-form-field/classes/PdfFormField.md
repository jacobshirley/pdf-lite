[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/fields/pdf-form-field](../README.md) / PdfFormField

# Abstract Class: PdfFormField

Abstract base form field class. Extends PdfWidgetAnnotation with form-specific properties:
FT, V, DA, Ff, T (name), field hierarchy (parent/children/siblings).
Subclasses must implement generateAppearance().

## Extends

- [`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md)

## Extended by

- [`PdfButtonFormField`](../../pdf-button-form-field/classes/PdfButtonFormField.md)
- [`PdfChoiceFormField`](../../pdf-choice-form-field/classes/PdfChoiceFormField.md)
- [`PdfSignatureFormField`](../../pdf-signature-form-field/classes/PdfSignatureFormField.md)
- [`PdfTextFormField`](../../pdf-text-form-field/classes/PdfTextFormField.md)

## Constructors

### Constructor

> **new PdfFormField**(`other?`): `PdfFormField`

#### Parameters

##### other?

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\> | \{ `form?`: [`PdfAcroForm`](../../../pdf-acro-form/classes/PdfAcroForm.md)\<`Record`\<`string`, `string`\>\>; \}

#### Returns

`PdfFormField`

#### Overrides

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`constructor`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#constructor)

## Properties

### \_form?

> `optional` **\_form**: [`PdfAcroForm`](../../../pdf-acro-form/classes/PdfAcroForm.md)\<`Record`\<`string`, `string`\>\>

**`Internal`**

---

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`cachedTokens`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#cachedtokens)

---

### compressed?

> `optional` **compressed**: `boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`compressed`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#compressed)

---

### content

> **content**: [`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`content`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#content)

---

### defaultGenerateAppearance

> **defaultGenerateAppearance**: `boolean` = `true`

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`encryptable`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`generationNumber`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`immutable`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`modified`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`objectNumber`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`offset`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`orderIndex`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`postTokens`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`preTokens`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`MAX_ORDER_INDEX`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#max_order_index)

## Accessors

### annotationFlags

#### Get Signature

> **get** **annotationFlags**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **annotationFlags**(`flags`): `void`

##### Parameters

###### flags

`number`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`annotationFlags`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#annotationflags)

---

### appearanceState

#### Get Signature

> **get** **appearanceState**(): `string` \| `null`

##### Returns

`string` \| `null`

#### Set Signature

> **set** **appearanceState**(`state`): `void`

##### Parameters

###### state

`string` | `null`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`appearanceState`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#appearancestate)

---

### appearanceStreamDict

#### Get Signature

> **get** **appearanceStreamDict**(): [`PdfAppearanceStreamDictionary`](../../../../annotations/pdf-annotation/type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

##### Returns

[`PdfAppearanceStreamDictionary`](../../../../annotations/pdf-annotation/type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

#### Set Signature

> **set** **appearanceStreamDict**(`dict`): `void`

##### Parameters

###### dict

[`PdfAppearanceStreamDictionary`](../../../../annotations/pdf-annotation/type-aliases/PdfAppearanceStreamDictionary.md) | `null`

##### Returns

`void`

#### Inherited from

[`PdfTextFormField`](../../pdf-text-form-field/classes/PdfTextFormField.md).[`appearanceStreamDict`](../../pdf-text-form-field/classes/PdfTextFormField.md#appearancestreamdict)

---

### children

#### Get Signature

> **get** **children**(): `PdfFormField`[]

##### Returns

`PdfFormField`[]

#### Set Signature

> **set** **children**(`fields`): `void`

##### Parameters

###### fields

`PdfFormField`[]

##### Returns

`void`

---

### comb

#### Get Signature

> **get** **comb**(): `boolean`

##### Returns

`boolean`

---

### combField

#### Get Signature

> **get** **combField**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **combField**(`v`): `void`

##### Parameters

###### v

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

> **set** **combo**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### commitOnSelChange

#### Get Signature

> **get** **commitOnSelChange**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **commitOnSelChange**(`v`): `void`

##### Parameters

###### v

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

### defaultResources

#### Get Signature

> **get** **defaultResources**(): [`PdfDefaultResourcesDictionary`](../../../../annotations/pdf-default-resources/classes/PdfDefaultResourcesDictionary.md) \| `null`

##### Returns

[`PdfDefaultResourcesDictionary`](../../../../annotations/pdf-default-resources/classes/PdfDefaultResourcesDictionary.md) \| `null`

#### Set Signature

> **set** **defaultResources**(`resources`): `void`

##### Parameters

###### resources

[`PdfDefaultResourcesDictionary`](../../../../annotations/pdf-default-resources/classes/PdfDefaultResourcesDictionary.md) | `null`

##### Returns

`void`

---

### defaultValue

#### Get Signature

> **get** **defaultValue**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **defaultValue**(`val`): `void`

##### Parameters

###### val

`string`

##### Returns

`void`

---

### doNotScroll

#### Get Signature

> **get** **doNotScroll**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **doNotScroll**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### doNotSpellCheck

#### Get Signature

> **get** **doNotSpellCheck**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **doNotSpellCheck**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### edit

#### Get Signature

> **get** **edit**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **edit**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### fieldType

#### Get Signature

> **get** **fieldType**(): `"Text"` \| `"Button"` \| `"Choice"` \| `"Signature"` \| `null`

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

> **get** **flags**(): [`PdfFormFieldFlags`](../../pdf-form-field-flags/classes/PdfFormFieldFlags.md)

##### Returns

[`PdfFormFieldFlags`](../../pdf-form-field-flags/classes/PdfFormFieldFlags.md)

#### Set Signature

> **set** **flags**(`v`): `void`

##### Parameters

###### v

[`PdfFormFieldFlags`](../../pdf-form-field-flags/classes/PdfFormFieldFlags.md)

##### Returns

`void`

---

### font

#### Get Signature

> **get** **font**(): [`PdfFont`](../../../../fonts/pdf-font/classes/PdfFont.md) \| `null`

##### Returns

[`PdfFont`](../../../../fonts/pdf-font/classes/PdfFont.md) \| `null`

#### Set Signature

> **set** **font**(`font`): `void`

##### Parameters

###### font

[`PdfFont`](../../../../fonts/pdf-font/classes/PdfFont.md) | `null`

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

### form

#### Set Signature

> **set** **form**(`f`): `void`

##### Parameters

###### f

[`PdfAcroForm`](../../../pdf-acro-form/classes/PdfAcroForm.md)

##### Returns

`void`

---

### hidden

#### Get Signature

> **get** **hidden**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **hidden**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`hidden`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#hidden)

---

### invisible

#### Get Signature

> **get** **invisible**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **invisible**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`invisible`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#invisible)

---

### isTrailingDelimited

#### Get Signature

> **get** **isTrailingDelimited**(): `boolean`

Returns true if this object's serialized form ends with a self-delimiting
character (e.g., `)`, `>`, `]`, `>>`). Such objects do not require trailing
whitespace before the next token.

##### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`isTrailingDelimited`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#istrailingdelimited)

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

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`isWidget`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#iswidget)

---

### key

#### Get Signature

> **get** **key**(): `string`

##### Returns

`string`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`key`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#key)

---

### kids

#### Get Signature

> **get** **kids**(): [`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\>\> \| `undefined`

##### Returns

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\>\> \| `undefined`

#### Set Signature

> **set** **kids**(`kids`): `void`

##### Parameters

###### kids

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\>[]

##### Returns

`void`

---

### locked

#### Get Signature

> **get** **locked**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **locked**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`locked`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#locked)

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

##### Returns

`boolean`

#### Set Signature

> **set** **multiline**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### multiSelect

#### Get Signature

> **get** **multiSelect**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **multiSelect**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **name**(`name`): `void`

##### Parameters

###### name

`string`

##### Returns

`void`

---

### noExport

#### Get Signature

> **get** **noExport**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noExport**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### noRotate

#### Get Signature

> **get** **noRotate**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noRotate**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`noRotate`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#norotate)

---

### noToggleToOff

#### Get Signature

> **get** **noToggleToOff**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noToggleToOff**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### noView

#### Get Signature

> **get** **noView**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noView**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`noView`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#noview)

---

### noZoom

#### Get Signature

> **get** **noZoom**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noZoom**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfSignatureFormField`](../../pdf-signature-form-field/classes/PdfSignatureFormField.md).[`noZoom`](../../pdf-signature-form-field/classes/PdfSignatureFormField.md#nozoom)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`objectType`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#objecttype)

---

### page

#### Get Signature

> **get** **page**(): [`PdfPage`](../../../../pdf/pdf-page/classes/PdfPage.md) \| `null`

##### Returns

[`PdfPage`](../../../../pdf/pdf-page/classes/PdfPage.md) \| `null`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`page`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#page)

---

### parent

#### Get Signature

> **get** **parent**(): `PdfFormField` \| `undefined`

##### Returns

`PdfFormField` \| `undefined`

#### Set Signature

> **set** **parent**(`field`): `void`

##### Parameters

###### field

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\> | `PdfFormField` | `undefined`

##### Returns

`void`

---

### parentRef

#### Get Signature

> **get** **parentRef**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\> \| `null`

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\> \| `null`

#### Set Signature

> **set** **parentRef**(`ref`): `void`

##### Parameters

###### ref

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\> | `null`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`parentRef`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#parentref)

---

### password

#### Get Signature

> **get** **password**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **password**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### print

#### Get Signature

> **get** **print**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **print**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfSignatureFormField`](../../pdf-signature-form-field/classes/PdfSignatureFormField.md).[`print`](../../pdf-signature-form-field/classes/PdfSignatureFormField.md#print)

---

### pushButton

#### Get Signature

> **get** **pushButton**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **pushButton**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### quadding

#### Get Signature

> **get** **quadding**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **quadding**(`q`): `void`

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

> **set** **radio**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### readOnly

#### Get Signature

> **get** **readOnly**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **readOnly**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### rect

#### Get Signature

> **get** **rect**(): \[`number`, `number`, `number`, `number`\] \| `null`

##### Returns

\[`number`, `number`, `number`, `number`\] \| `null`

#### Set Signature

> **set** **rect**(`rect`): `void`

##### Parameters

###### rect

\[`number`, `number`, `number`, `number`\] | `null`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`rect`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#rect)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`reference`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#reference)

---

### required

#### Get Signature

> **get** **required**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **required**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### siblings

#### Get Signature

> **get** **siblings**(): `PdfFormField`[]

##### Returns

`PdfFormField`[]

---

### sort

#### Get Signature

> **get** **sort**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **sort**(`v`): `void`

##### Parameters

###### v

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

`string` | [`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md)

##### Returns

`void`

## Methods

### \_storeValue()

> `protected` **\_storeValue**(`val`, `fieldParent`): `boolean`

Writes the value to the dictionary. Returns true if appearance generation
should proceed, false to skip it (e.g. when value was cleared).
Override in subclasses to change the stored representation.

#### Parameters

##### val

`string` | [`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md)

##### fieldParent

`PdfFormField` | `undefined`

#### Returns

`boolean`

---

### as()

> **as**\<`T`\>(`ctor`): `T`

Attempts to cast the object to a specific PdfObject subclass

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### ctor

(...`args`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`as`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#as)

---

### becomes()

> **becomes**\<`T`\>(`cls`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`becomes`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#becomes)

---

### buildFontResources()

> **buildFontResources**(`fontName`): [`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\> \| `undefined`

Builds a Resources dictionary containing the font entry for `fontName`,
resolved from DR (handling indirect references) or from a loaded font.
Returns undefined if neither source provides the font.

#### Parameters

##### fontName

`string`

#### Returns

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\> \| `undefined`

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`clone`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`cloneImpl`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`copyFrom`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#copyfrom)

---

### equals()

> **equals**(`other?`): `boolean`

Compares this object to another for equality based on their token representations

#### Parameters

##### other?

[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`equals`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#equals)

---

### generateAppearance()

> `abstract` **generateAppearance**(`options?`): `boolean`

#### Parameters

##### options?

###### makeReadOnly?

`boolean`

###### textYOffset?

`number`

#### Returns

`boolean`

---

### getAppearanceStream()

> **getAppearanceStream**(`setting?`): [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>\> \| `null`

#### Parameters

##### setting?

`string`

#### Returns

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>\> \| `null`

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`inPdf`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`isEncryptable`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`isImmutable`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`isModified`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\>

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`matchesReference`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`order`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#order)

---

### resolve()

> **resolve**\<`T`\>(`cls?`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls?

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`resolve`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#resolve)

---

### setAppearanceStream()

> **setAppearanceStream**(`stream`): `void`

#### Parameters

##### stream

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\> | \{\[`key`: `string`\]: [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>; \}

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

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`setImmutable`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#setimmutable)

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

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`setModified`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`toBase64`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#tobase64)

---

### toBytes()

> **toBytes**(`padTo?`): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Converts the object to a ByteArray, optionally padding to a specified length

#### Parameters

##### padTo?

`number`

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`toBytes`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`tokenize`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`toString`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`toTokens`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#totokens)

---

### create()

> `static` **create**(`other?`): `PdfFormField`

#### Parameters

##### other?

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Returns

`PdfFormField`

---

### createPlaceholder()

> `static` **createPlaceholder**\<`T`\>(`objectNumber?`, `generationNumber?`, `content?`): [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### objectNumber?

`number`

##### generationNumber?

`number`

##### content?

`T`

#### Returns

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md).[`createPlaceholder`](../../../../annotations/pdf-widget-annotation/classes/PdfWidgetAnnotation.md#createplaceholder)

---

### registerFieldType()

> `static` **registerFieldType**(`ft`, `ctor`, `options?`): `void`

#### Parameters

##### ft

`"Sig"` | `"Tx"` | `"Btn"` | `"Ch"`

##### ctor

(`other?`) => `PdfFormField`

##### options?

###### fallback?

`boolean`

#### Returns

`void`
