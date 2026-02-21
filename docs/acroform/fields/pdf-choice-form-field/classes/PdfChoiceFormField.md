[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/fields/pdf-choice-form-field](../README.md) / PdfChoiceFormField

# Class: PdfChoiceFormField

Choice form field subtype (dropdowns, list boxes).

## Extends

- [`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)

## Constructors

### Constructor

> **new PdfChoiceFormField**(`options?`): `PdfChoiceFormField`

#### Parameters

##### options?

###### form?

[`FormContext`](../../types/interfaces/FormContext.md)\<[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)\>

###### other?

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>

###### parent?

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)

#### Returns

`PdfChoiceFormField`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`constructor`](../../pdf-form-field/classes/PdfFormField.md#constructor)

## Properties

### \_appearanceStream?

> `protected` `optional` **\_appearanceStream**: [`PdfAppearanceStream`](../../../appearance/pdf-appearance-stream/classes/PdfAppearanceStream.md)

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`_appearanceStream`](../../pdf-form-field/classes/PdfFormField.md#_appearancestream)

---

### \_appearanceStreamYes?

> `protected` `optional` **\_appearanceStreamYes**: [`PdfAppearanceStream`](../../../appearance/pdf-appearance-stream/classes/PdfAppearanceStream.md)

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`_appearanceStreamYes`](../../pdf-form-field/classes/PdfFormField.md#_appearancestreamyes)

---

### content

> **content**: [`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`content`](../../pdf-form-field/classes/PdfFormField.md#content)

---

### defaultGenerateAppearance

> **defaultGenerateAppearance**: `boolean` = `true`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`defaultGenerateAppearance`](../../pdf-form-field/classes/PdfFormField.md#defaultgenerateappearance)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`encryptable`](../../pdf-form-field/classes/PdfFormField.md#encryptable)

---

### form?

> `optional` **form**: [`FormContext`](../../types/interfaces/FormContext.md)\<[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)\>

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`form`](../../pdf-form-field/classes/PdfFormField.md#form)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`generationNumber`](../../pdf-form-field/classes/PdfFormField.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`immutable`](../../pdf-form-field/classes/PdfFormField.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`modified`](../../pdf-form-field/classes/PdfFormField.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`objectNumber`](../../pdf-form-field/classes/PdfFormField.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`offset`](../../pdf-form-field/classes/PdfFormField.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`orderIndex`](../../pdf-form-field/classes/PdfFormField.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`postTokens`](../../pdf-form-field/classes/PdfFormField.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`preTokens`](../../pdf-form-field/classes/PdfFormField.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`MAX_ORDER_INDEX`](../../pdf-form-field/classes/PdfFormField.md#max_order_index)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`annotationFlags`](../../pdf-form-field/classes/PdfFormField.md#annotationflags)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`appearanceState`](../../pdf-form-field/classes/PdfFormField.md#appearancestate)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`appearanceStreamDict`](../../pdf-form-field/classes/PdfFormField.md#appearancestreamdict)

---

### checked

#### Get Signature

> **get** **checked**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **checked**(`_isChecked`): `void`

##### Parameters

###### \_isChecked

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`checked`](../../pdf-form-field/classes/PdfFormField.md#checked)

---

### children

#### Get Signature

> **get** **children**(): [`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)[]

##### Returns

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)[]

#### Set Signature

> **set** **children**(`fields`): `void`

##### Parameters

###### fields

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)[]

##### Returns

`void`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`children`](../../pdf-form-field/classes/PdfFormField.md#children)

---

### comb

#### Get Signature

> **get** **comb**(): `boolean`

##### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`comb`](../../pdf-form-field/classes/PdfFormField.md#comb)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`combField`](../../pdf-form-field/classes/PdfFormField.md#combfield)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`combo`](../../pdf-form-field/classes/PdfFormField.md#combo)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`commitOnSelChange`](../../pdf-form-field/classes/PdfFormField.md#commitonselchange)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`defaultAppearance`](../../pdf-form-field/classes/PdfFormField.md#defaultappearance)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`defaultValue`](../../pdf-form-field/classes/PdfFormField.md#defaultvalue)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`doNotScroll`](../../pdf-form-field/classes/PdfFormField.md#donotscroll)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`doNotSpellCheck`](../../pdf-form-field/classes/PdfFormField.md#donotspellcheck)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`edit`](../../pdf-form-field/classes/PdfFormField.md#edit)

---

### encodingMap

#### Get Signature

> **get** **encodingMap**(): `Map`\<`number`, `string`\> \| `undefined`

##### Returns

`Map`\<`number`, `string`\> \| `undefined`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`encodingMap`](../../pdf-form-field/classes/PdfFormField.md#encodingmap)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`fieldType`](../../pdf-form-field/classes/PdfFormField.md#fieldtype)

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

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`flags`](../../pdf-form-field/classes/PdfFormField.md#flags)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`font`](../../pdf-form-field/classes/PdfFormField.md#font)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`fontName`](../../pdf-form-field/classes/PdfFormField.md#fontname)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`fontSize`](../../pdf-form-field/classes/PdfFormField.md#fontsize)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`hidden`](../../pdf-form-field/classes/PdfFormField.md#hidden)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`invisible`](../../pdf-form-field/classes/PdfFormField.md#invisible)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`isWidget`](../../pdf-form-field/classes/PdfFormField.md#iswidget)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`kids`](../../pdf-form-field/classes/PdfFormField.md#kids)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`locked`](../../pdf-form-field/classes/PdfFormField.md#locked)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`maxLen`](../../pdf-form-field/classes/PdfFormField.md#maxlen)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`multiline`](../../pdf-form-field/classes/PdfFormField.md#multiline)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`multiSelect`](../../pdf-form-field/classes/PdfFormField.md#multiselect)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`name`](../../pdf-form-field/classes/PdfFormField.md#name)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`noExport`](../../pdf-form-field/classes/PdfFormField.md#noexport)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`noRotate`](../../pdf-form-field/classes/PdfFormField.md#norotate)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`noToggleToOff`](../../pdf-form-field/classes/PdfFormField.md#notoggletooff)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`noView`](../../pdf-form-field/classes/PdfFormField.md#noview)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`noZoom`](../../pdf-form-field/classes/PdfFormField.md#nozoom)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`objectType`](../../pdf-form-field/classes/PdfFormField.md#objecttype)

---

### options

#### Get Signature

> **get** **options**(): `object`[]

##### Returns

`object`[]

#### Set Signature

> **set** **options**(`values`): `void`

##### Parameters

###### values

`string`[] | `object`[] | `undefined`

##### Returns

`void`

---

### parent

#### Get Signature

> **get** **parent**(): [`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md) \| `undefined`

##### Returns

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md) \| `undefined`

#### Set Signature

> **set** **parent**(`field`): `void`

##### Parameters

###### field

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md) | `undefined`

##### Returns

`void`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`parent`](../../pdf-form-field/classes/PdfFormField.md#parent)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`parentRef`](../../pdf-form-field/classes/PdfFormField.md#parentref)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`password`](../../pdf-form-field/classes/PdfFormField.md#password)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`print`](../../pdf-form-field/classes/PdfFormField.md#print)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`pushButton`](../../pdf-form-field/classes/PdfFormField.md#pushbutton)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`quadding`](../../pdf-form-field/classes/PdfFormField.md#quadding)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`radio`](../../pdf-form-field/classes/PdfFormField.md#radio)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`readOnly`](../../pdf-form-field/classes/PdfFormField.md#readonly)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`rect`](../../pdf-form-field/classes/PdfFormField.md#rect)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`reference`](../../pdf-form-field/classes/PdfFormField.md#reference)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`required`](../../pdf-form-field/classes/PdfFormField.md#required)

---

### selectedIndex

#### Get Signature

> **get** **selectedIndex**(): `number`

##### Returns

`number`

---

### siblings

#### Get Signature

> **get** **siblings**(): [`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)[]

##### Returns

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)[]

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`siblings`](../../pdf-form-field/classes/PdfFormField.md#siblings)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`sort`](../../pdf-form-field/classes/PdfFormField.md#sort)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`value`](../../pdf-form-field/classes/PdfFormField.md#value)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md) | `undefined`

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`_storeValue`](../../pdf-form-field/classes/PdfFormField.md#_storevalue)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`as`](../../pdf-form-field/classes/PdfFormField.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`clone`](../../pdf-form-field/classes/PdfFormField.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`cloneImpl`](../../pdf-form-field/classes/PdfFormField.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`copyFrom`](../../pdf-form-field/classes/PdfFormField.md#copyfrom)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`equals`](../../pdf-form-field/classes/PdfFormField.md#equals)

---

### generateAppearance()

> **generateAppearance**(`options?`): `boolean`

#### Parameters

##### options?

###### makeReadOnly?

`boolean`

#### Returns

`boolean`

#### Overrides

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`generateAppearance`](../../pdf-form-field/classes/PdfFormField.md#generateappearance)

---

### getAppearanceStream()

> **getAppearanceStream**(): [`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> \| `undefined`

#### Returns

[`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> \| `undefined`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`getAppearanceStream`](../../pdf-form-field/classes/PdfFormField.md#getappearancestream)

---

### getAppearanceStreamsForWriting()

> **getAppearanceStreamsForWriting**(): \{ `primary`: [`PdfAppearanceStream`](../../../appearance/pdf-appearance-stream/classes/PdfAppearanceStream.md); `secondary?`: [`PdfAppearanceStream`](../../../appearance/pdf-appearance-stream/classes/PdfAppearanceStream.md); \} \| `undefined`

#### Returns

\{ `primary`: [`PdfAppearanceStream`](../../../appearance/pdf-appearance-stream/classes/PdfAppearanceStream.md); `secondary?`: [`PdfAppearanceStream`](../../../appearance/pdf-appearance-stream/classes/PdfAppearanceStream.md); \} \| `undefined`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`getAppearanceStreamsForWriting`](../../pdf-form-field/classes/PdfFormField.md#getappearancestreamsforwriting)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`inPdf`](../../pdf-form-field/classes/PdfFormField.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`isEncryptable`](../../pdf-form-field/classes/PdfFormField.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`isImmutable`](../../pdf-form-field/classes/PdfFormField.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`isModified`](../../pdf-form-field/classes/PdfFormField.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`matchesReference`](../../pdf-form-field/classes/PdfFormField.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`order`](../../pdf-form-field/classes/PdfFormField.md#order)

---

### setAppearanceReference()

> **setAppearanceReference**(`appearanceStreamRef`, `_appearanceStreamYesRef?`): `void`

#### Parameters

##### appearanceStreamRef

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### \_appearanceStreamYesRef?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`void`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`setAppearanceReference`](../../pdf-form-field/classes/PdfFormField.md#setappearancereference)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`setImmutable`](../../pdf-form-field/classes/PdfFormField.md#setimmutable)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`setModified`](../../pdf-form-field/classes/PdfFormField.md#setmodified)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`toBytes`](../../pdf-form-field/classes/PdfFormField.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`tokenize`](../../pdf-form-field/classes/PdfFormField.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`toString`](../../pdf-form-field/classes/PdfFormField.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`toTokens`](../../pdf-form-field/classes/PdfFormField.md#totokens)

---

### tryGenerateAppearance()

> `protected` **tryGenerateAppearance**(`field`): `void`

#### Parameters

##### field

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)

#### Returns

`void`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`tryGenerateAppearance`](../../pdf-form-field/classes/PdfFormField.md#trygenerateappearance)

---

### create()

> `static` **create**(`options`): [`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)

#### Parameters

##### options

###### form

[`FormContext`](../../types/interfaces/FormContext.md)\<[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)\>

###### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

###### parent?

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)

#### Returns

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`create`](../../pdf-form-field/classes/PdfFormField.md#create)

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

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`createPlaceholder`](../../pdf-form-field/classes/PdfFormField.md#createplaceholder)

---

### registerFieldType()

> `static` **registerFieldType**(`ft`, `ctor`, `options?`): `void`

#### Parameters

##### ft

`"Sig"` | `"Tx"` | `"Btn"` | `"Ch"`

##### ctor

(`options?`) => [`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md)

##### options?

###### fallback?

`boolean`

#### Returns

`void`

#### Inherited from

[`PdfFormField`](../../pdf-form-field/classes/PdfFormField.md).[`registerFieldType`](../../pdf-form-field/classes/PdfFormField.md#registerfieldtype)
