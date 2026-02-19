[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/fields/PdfFormField](../README.md) / PdfFormField

# Abstract Class: PdfFormField

Abstract base form field class. Extends PdfWidgetAnnotation with form-specific properties:
FT, V, DA, Ff, T (name), field hierarchy (parent/children/siblings).
Subclasses must implement generateAppearance().

## Extends

- [`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md)

## Extended by

- [`PdfButtonFormField`](../../PdfButtonFormField/classes/PdfButtonFormField.md)
- [`PdfChoiceFormField`](../../PdfChoiceFormField/classes/PdfChoiceFormField.md)
- [`PdfSignatureFormField`](../../PdfSignatureFormField/classes/PdfSignatureFormField.md)
- [`PdfTextFormField`](../../PdfTextFormField/classes/PdfTextFormField.md)

## Constructors

### Constructor

> **new PdfFormField**(`options?`): `PdfFormField`

#### Parameters

##### options?

###### form?

[`FormContext`](../../types/interfaces/FormContext.md)\<`PdfFormField`\>

###### other?

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>

###### parent?

`PdfFormField`

#### Returns

`PdfFormField`

#### Overrides

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`constructor`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#constructor)

## Properties

### \_appearanceStream?

> `protected` `optional` **\_appearanceStream**: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md)

---

### \_appearanceStreamYes?

> `protected` `optional` **\_appearanceStreamYes**: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md)

---

### content

> **content**: [`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`content`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#content)

---

### defaultGenerateAppearance

> **defaultGenerateAppearance**: `boolean` = `true`

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`encryptable`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#encryptable)

---

### form?

> `optional` **form**: [`FormContext`](../../types/interfaces/FormContext.md)\<`PdfFormField`\>

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`generationNumber`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`immutable`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`modified`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`objectNumber`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`offset`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`orderIndex`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`postTokens`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`preTokens`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`MAX_ORDER_INDEX`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#max_order_index)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`annotationFlags`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#annotationflags)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`appearanceState`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#appearancestate)

---

### appearanceStreamDict

#### Get Signature

> **get** **appearanceStreamDict**(): [`PdfAppearanceStreamDictionary`](../../../../annotations/PdfAnnotation/type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

##### Returns

[`PdfAppearanceStreamDictionary`](../../../../annotations/PdfAnnotation/type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

#### Set Signature

> **set** **appearanceStreamDict**(`dict`): `void`

##### Parameters

###### dict

[`PdfAppearanceStreamDictionary`](../../../../annotations/PdfAnnotation/type-aliases/PdfAppearanceStreamDictionary.md) | `null`

##### Returns

`void`

#### Inherited from

[`PdfTextFormField`](../../PdfTextFormField/classes/PdfTextFormField.md).[`appearanceStreamDict`](../../PdfTextFormField/classes/PdfTextFormField.md#appearancestreamdict)

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

### encodingMap

#### Get Signature

> **get** **encodingMap**(): `Map`\<`number`, `string`\> \| `undefined`

##### Returns

`Map`\<`number`, `string`\> \| `undefined`

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

> **get** **flags**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **flags**(`flags`): `void`

##### Parameters

###### flags

`number`

##### Returns

`void`

---

### font

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`hidden`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#hidden)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`invisible`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#invisible)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`isWidget`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#iswidget)

---

### kids

#### Get Signature

> **get** **kids**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)[]

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)[]

#### Set Signature

> **set** **kids**(`kids`): `void`

##### Parameters

###### kids

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)[]

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`locked`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#locked)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`noRotate`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#norotate)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`noView`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#noview)

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

[`PdfSignatureFormField`](../../PdfSignatureFormField/classes/PdfSignatureFormField.md).[`noZoom`](../../PdfSignatureFormField/classes/PdfSignatureFormField.md#nozoom)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`objectType`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#objecttype)

---

### options

#### Get Signature

> **get** **options**(): `string`[]

##### Returns

`string`[]

#### Set Signature

> **set** **options**(`options`): `void`

##### Parameters

###### options

`string`[]

##### Returns

`void`

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

`PdfFormField` | `undefined`

##### Returns

`void`

---

### parentRef

#### Get Signature

> **get** **parentRef**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) \| `null`

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) \| `null`

#### Set Signature

> **set** **parentRef**(`ref`): `void`

##### Parameters

###### ref

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) | `null`

##### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`parentRef`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#parentref)

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

[`PdfSignatureFormField`](../../PdfSignatureFormField/classes/PdfSignatureFormField.md).[`print`](../../PdfSignatureFormField/classes/PdfSignatureFormField.md#print)

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

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`rect`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#rect)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`reference`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#reference)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`as`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`clone`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`cloneImpl`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`copyFrom`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#copyfrom)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`equals`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#equals)

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

> **getAppearanceStream**(): [`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> \| `undefined`

#### Returns

[`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> \| `undefined`

---

### getAppearanceStreamsForWriting()

> **getAppearanceStreamsForWriting**(): \{ `primary`: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md); `secondary?`: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md); \} \| `undefined`

#### Returns

\{ `primary`: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md); `secondary?`: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md); \} \| `undefined`

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`inPdf`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`isEncryptable`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`isImmutable`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`isModified`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`matchesReference`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`order`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#order)

---

### setAppearanceReference()

> **setAppearanceReference**(`appearanceStreamRef`, `appearanceStreamYesRef?`): `void`

#### Parameters

##### appearanceStreamRef

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### appearanceStreamYesRef?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`setImmutable`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#setimmutable)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`setModified`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#setmodified)

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`toBytes`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`tokenize`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`toString`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`toTokens`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#totokens)

---

### create()

> `static` **create**(`options`): `PdfFormField`

#### Parameters

##### options

###### form

[`FormContext`](../../types/interfaces/FormContext.md)\<`PdfFormField`\>

###### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

###### parent?

`PdfFormField`

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

[`PdfWidgetAnnotation`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md).[`createPlaceholder`](../../../../annotations/PdfWidgetAnnotation/classes/PdfWidgetAnnotation.md#createplaceholder)

---

### registerFieldType()

> `static` **registerFieldType**(`ft`, `ctor`, `options?`): `void`

#### Parameters

##### ft

`string`

##### ctor

(`options?`) => `PdfFormField`

##### options?

###### fallback?

`boolean`

#### Returns

`void`
