[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/fields/PdfTextFormField](../README.md) / PdfTextFormField

# Class: PdfTextFormField

Text form field subtype.

## Extends

- [`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)

## Constructors

### Constructor

> **new PdfTextFormField**(`options?`): `PdfTextFormField`

#### Parameters

##### options?

###### form?

[`FormContext`](../../types/interfaces/FormContext.md)\<[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)\>

###### other?

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>

###### parent?

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)

#### Returns

`PdfTextFormField`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`constructor`](../../PdfFormField/classes/PdfFormField.md#constructor)

## Properties

### \_appearanceStream?

> `protected` `optional` **\_appearanceStream**: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md)

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`_appearanceStream`](../../PdfFormField/classes/PdfFormField.md#_appearancestream)

---

### \_appearanceStreamYes?

> `protected` `optional` **\_appearanceStreamYes**: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md)

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`_appearanceStreamYes`](../../PdfFormField/classes/PdfFormField.md#_appearancestreamyes)

---

### content

> **content**: [`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`content`](../../PdfFormField/classes/PdfFormField.md#content)

---

### defaultGenerateAppearance

> **defaultGenerateAppearance**: `boolean` = `true`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`defaultGenerateAppearance`](../../PdfFormField/classes/PdfFormField.md#defaultgenerateappearance)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`encryptable`](../../PdfFormField/classes/PdfFormField.md#encryptable)

---

### form?

> `optional` **form**: [`FormContext`](../../types/interfaces/FormContext.md)\<[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)\>

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`form`](../../PdfFormField/classes/PdfFormField.md#form)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`generationNumber`](../../PdfFormField/classes/PdfFormField.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`immutable`](../../PdfFormField/classes/PdfFormField.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`modified`](../../PdfFormField/classes/PdfFormField.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`objectNumber`](../../PdfFormField/classes/PdfFormField.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`offset`](../../PdfFormField/classes/PdfFormField.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`orderIndex`](../../PdfFormField/classes/PdfFormField.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`postTokens`](../../PdfFormField/classes/PdfFormField.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`preTokens`](../../PdfFormField/classes/PdfFormField.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`MAX_ORDER_INDEX`](../../PdfFormField/classes/PdfFormField.md#max_order_index)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`annotationFlags`](../../PdfFormField/classes/PdfFormField.md#annotationflags)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`appearanceState`](../../PdfFormField/classes/PdfFormField.md#appearancestate)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`appearanceStreamDict`](../../PdfFormField/classes/PdfFormField.md#appearancestreamdict)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`checked`](../../PdfFormField/classes/PdfFormField.md#checked)

---

### children

#### Get Signature

> **get** **children**(): [`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)[]

##### Returns

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)[]

#### Set Signature

> **set** **children**(`fields`): `void`

##### Parameters

###### fields

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)[]

##### Returns

`void`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`children`](../../PdfFormField/classes/PdfFormField.md#children)

---

### comb

#### Get Signature

> **get** **comb**(): `boolean`

##### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`comb`](../../PdfFormField/classes/PdfFormField.md#comb)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`combField`](../../PdfFormField/classes/PdfFormField.md#combfield)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`combo`](../../PdfFormField/classes/PdfFormField.md#combo)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`commitOnSelChange`](../../PdfFormField/classes/PdfFormField.md#commitonselchange)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`defaultAppearance`](../../PdfFormField/classes/PdfFormField.md#defaultappearance)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`defaultValue`](../../PdfFormField/classes/PdfFormField.md#defaultvalue)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`doNotScroll`](../../PdfFormField/classes/PdfFormField.md#donotscroll)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`doNotSpellCheck`](../../PdfFormField/classes/PdfFormField.md#donotspellcheck)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`edit`](../../PdfFormField/classes/PdfFormField.md#edit)

---

### encodingMap

#### Get Signature

> **get** **encodingMap**(): `Map`\<`number`, `string`\> \| `undefined`

##### Returns

`Map`\<`number`, `string`\> \| `undefined`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`encodingMap`](../../PdfFormField/classes/PdfFormField.md#encodingmap)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`fieldType`](../../PdfFormField/classes/PdfFormField.md#fieldtype)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`flags`](../../PdfFormField/classes/PdfFormField.md#flags)

---

### font

#### Set Signature

> **set** **font**(`font`): `void`

##### Parameters

###### font

[`PdfFont`](../../../../fonts/pdf-font/classes/PdfFont.md) | `null`

##### Returns

`void`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`font`](../../PdfFormField/classes/PdfFormField.md#font)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`fontName`](../../PdfFormField/classes/PdfFormField.md#fontname)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`fontSize`](../../PdfFormField/classes/PdfFormField.md#fontsize)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`hidden`](../../PdfFormField/classes/PdfFormField.md#hidden)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`invisible`](../../PdfFormField/classes/PdfFormField.md#invisible)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`isWidget`](../../PdfFormField/classes/PdfFormField.md#iswidget)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`kids`](../../PdfFormField/classes/PdfFormField.md#kids)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`locked`](../../PdfFormField/classes/PdfFormField.md#locked)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`maxLen`](../../PdfFormField/classes/PdfFormField.md#maxlen)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`multiline`](../../PdfFormField/classes/PdfFormField.md#multiline)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`multiSelect`](../../PdfFormField/classes/PdfFormField.md#multiselect)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`name`](../../PdfFormField/classes/PdfFormField.md#name)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`noExport`](../../PdfFormField/classes/PdfFormField.md#noexport)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`noRotate`](../../PdfFormField/classes/PdfFormField.md#norotate)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`noToggleToOff`](../../PdfFormField/classes/PdfFormField.md#notoggletooff)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`noView`](../../PdfFormField/classes/PdfFormField.md#noview)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`objectType`](../../PdfFormField/classes/PdfFormField.md#objecttype)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`options`](../../PdfFormField/classes/PdfFormField.md#options)

---

### parent

#### Get Signature

> **get** **parent**(): [`PdfFormField`](../../PdfFormField/classes/PdfFormField.md) \| `undefined`

##### Returns

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md) \| `undefined`

#### Set Signature

> **set** **parent**(`field`): `void`

##### Parameters

###### field

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md) | `undefined`

##### Returns

`void`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`parent`](../../PdfFormField/classes/PdfFormField.md#parent)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`parentRef`](../../PdfFormField/classes/PdfFormField.md#parentref)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`password`](../../PdfFormField/classes/PdfFormField.md#password)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`pushButton`](../../PdfFormField/classes/PdfFormField.md#pushbutton)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`quadding`](../../PdfFormField/classes/PdfFormField.md#quadding)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`radio`](../../PdfFormField/classes/PdfFormField.md#radio)

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

#### Inherited from

[`PdfSignatureFormField`](../../PdfSignatureFormField/classes/PdfSignatureFormField.md).[`readOnly`](../../PdfSignatureFormField/classes/PdfSignatureFormField.md#readonly)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`rect`](../../PdfFormField/classes/PdfFormField.md#rect)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`reference`](../../PdfFormField/classes/PdfFormField.md#reference)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`required`](../../PdfFormField/classes/PdfFormField.md#required)

---

### siblings

#### Get Signature

> **get** **siblings**(): [`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)[]

##### Returns

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)[]

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`siblings`](../../PdfFormField/classes/PdfFormField.md#siblings)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`sort`](../../PdfFormField/classes/PdfFormField.md#sort)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`value`](../../PdfFormField/classes/PdfFormField.md#value)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`as`](../../PdfFormField/classes/PdfFormField.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`clone`](../../PdfFormField/classes/PdfFormField.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`cloneImpl`](../../PdfFormField/classes/PdfFormField.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`copyFrom`](../../PdfFormField/classes/PdfFormField.md#copyfrom)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`equals`](../../PdfFormField/classes/PdfFormField.md#equals)

---

### generateAppearance()

> **generateAppearance**(`options?`): `boolean`

#### Parameters

##### options?

###### makeReadOnly?

`boolean`

###### textYOffset?

`number`

#### Returns

`boolean`

#### Overrides

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`generateAppearance`](../../PdfFormField/classes/PdfFormField.md#generateappearance)

---

### getAppearanceStream()

> **getAppearanceStream**(): [`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> \| `undefined`

#### Returns

[`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> \| `undefined`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`getAppearanceStream`](../../PdfFormField/classes/PdfFormField.md#getappearancestream)

---

### getAppearanceStreamsForWriting()

> **getAppearanceStreamsForWriting**(): \{ `primary`: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md); `secondary?`: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md); \} \| `undefined`

#### Returns

\{ `primary`: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md); `secondary?`: [`PdfAppearanceStream`](../../../appearance/PdfAppearanceStream/classes/PdfAppearanceStream.md); \} \| `undefined`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`getAppearanceStreamsForWriting`](../../PdfFormField/classes/PdfFormField.md#getappearancestreamsforwriting)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`inPdf`](../../PdfFormField/classes/PdfFormField.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`isEncryptable`](../../PdfFormField/classes/PdfFormField.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`isImmutable`](../../PdfFormField/classes/PdfFormField.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`isModified`](../../PdfFormField/classes/PdfFormField.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`matchesReference`](../../PdfFormField/classes/PdfFormField.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`order`](../../PdfFormField/classes/PdfFormField.md#order)

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

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`setAppearanceReference`](../../PdfFormField/classes/PdfFormField.md#setappearancereference)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`setImmutable`](../../PdfFormField/classes/PdfFormField.md#setimmutable)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`setModified`](../../PdfFormField/classes/PdfFormField.md#setmodified)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`toBytes`](../../PdfFormField/classes/PdfFormField.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`tokenize`](../../PdfFormField/classes/PdfFormField.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`toString`](../../PdfFormField/classes/PdfFormField.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`toTokens`](../../PdfFormField/classes/PdfFormField.md#totokens)

---

### create()

> `static` **create**(`options`): [`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)

#### Parameters

##### options

###### form

[`FormContext`](../../types/interfaces/FormContext.md)\<[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)\>

###### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

###### parent?

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)

#### Returns

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`create`](../../PdfFormField/classes/PdfFormField.md#create)

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

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`createPlaceholder`](../../PdfFormField/classes/PdfFormField.md#createplaceholder)

---

### registerFieldType()

> `static` **registerFieldType**(`ft`, `ctor`, `options?`): `void`

#### Parameters

##### ft

`string`

##### ctor

(`options?`) => [`PdfFormField`](../../PdfFormField/classes/PdfFormField.md)

##### options?

###### fallback?

`boolean`

#### Returns

`void`

#### Inherited from

[`PdfFormField`](../../PdfFormField/classes/PdfFormField.md).[`registerFieldType`](../../PdfFormField/classes/PdfFormField.md#registerfieldtype)
