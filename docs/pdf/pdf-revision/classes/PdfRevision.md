[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [pdf/pdf-revision](../README.md) / PdfRevision

# Class: PdfRevision

Represents a single revision of a PDF document.
PDF documents can have multiple revisions for incremental updates,
where each revision contains its own set of objects and cross-reference table.

## Extends

- [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

## Constructors

### Constructor

> **new PdfRevision**(`options?`): `PdfRevision`

Creates a new PDF revision.

#### Parameters

##### options?

Configuration options for the revision

###### locked?

`boolean`

Whether the revision should be locked initially

###### objects?

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Initial objects for this revision

###### prev?

[`PdfXrefLookup`](../../pdf-xref-lookup/classes/PdfXrefLookup.md) \| `PdfRevision`

Previous revision or xref lookup to link to

#### Returns

`PdfRevision`

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`constructor`](../../../core/objects/pdf-object/classes/PdfObject.md#constructor)

## Properties

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`immutable`](../../../core/objects/pdf-object/classes/PdfObject.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`modified`](../../../core/objects/pdf-object/classes/PdfObject.md#modified)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`postTokens`](../../../core/objects/pdf-object/classes/PdfObject.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`preTokens`](../../../core/objects/pdf-object/classes/PdfObject.md#pretokens)

---

### xref

> **xref**: [`PdfXrefLookup`](../../pdf-xref-lookup/classes/PdfXrefLookup.md)

Cross-reference lookup table for this revision

## Accessors

### header

#### Get Signature

> **get** **header**(): [`PdfComment`](../../../core/objects/pdf-comment/classes/PdfComment.md) \| `undefined`

##### Returns

[`PdfComment`](../../../core/objects/pdf-comment/classes/PdfComment.md) \| `undefined`

#### Set Signature

> **set** **header**(`comment`): `void`

##### Parameters

###### comment

[`PdfComment`](../../../core/objects/pdf-comment/classes/PdfComment.md)

##### Returns

`void`

---

### locked

#### Get Signature

> **get** **locked**(): `boolean`

Gets whether this revision is locked (cannot be modified).

##### Returns

`boolean`

#### Set Signature

> **set** **locked**(`value`): `void`

Sets whether this revision is locked.
When locking, creates a cached clone of all objects to freeze their state.
When unlocking, clears the cache.

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### objects

#### Get Signature

> **get** **objects**(): readonly [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Gets the objects in this revision.
Returns fresh clones of cached objects if the revision is locked, otherwise returns live objects.
Each access to a locked revision's objects returns new clones to prevent mutations.

##### Returns

readonly [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

#### Set Signature

> **set** **objects**(`value`): `void`

Sets the objects array.

##### Throws

Error if the revision is locked

##### Parameters

###### value

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

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

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`objectType`](../../../core/objects/pdf-object/classes/PdfObject.md#objecttype)

---

### trailerDict

#### Get Signature

> **get** **trailerDict**(): [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfTrailerEntries`](../../../core/objects/pdf-trailer/type-aliases/PdfTrailerEntries.md)\>

Gets the trailer dictionary for this revision.

##### Returns

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfTrailerEntries`](../../../core/objects/pdf-trailer/type-aliases/PdfTrailerEntries.md)\>

The trailer dictionary containing document metadata references

## Methods

### addObject()

> **addObject**(...`objects`): `void`

Adds objects to the revision.

#### Parameters

##### objects

...[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Objects to add to the revision

#### Returns

`void`

#### Throws

Error if the revision is locked

---

### addObjectAt()

> **addObjectAt**(`object`, `index?`): `void`

Adds an object at a specific position in the revision.

#### Parameters

##### object

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

The object to add

##### index?

Position to insert at (number) or object to insert before

`number` | [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Returns

`void`

#### Throws

Error if the revision is locked or index is out of bounds

---

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

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`as`](../../../core/objects/pdf-object/classes/PdfObject.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep copy of this revision.

#### Returns

`this`

A cloned PdfRevision instance

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`clone`](../../../core/objects/pdf-object/classes/PdfObject.md#clone)

---

### contains()

> **contains**(`object`): `boolean`

Checks if an object reference exists in this revision.

#### Parameters

##### object

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

The object to check for

#### Returns

`boolean`

True if the exact object instance exists in this revision

---

### deleteObject()

> **deleteObject**(...`objects`): `void`

Removes objects from the revision.

#### Parameters

##### objects

...[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Objects to remove from the revision

#### Returns

`void`

#### Throws

Error if the revision is locked

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

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`equals`](../../../core/objects/pdf-object/classes/PdfObject.md#equals)

---

### exists()

> **exists**(`object`): `boolean`

Checks if an equivalent object exists in this revision (by value equality).

#### Parameters

##### object

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

The object to check for

#### Returns

`boolean`

True if an equal object exists in this revision

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`isImmutable`](../../../core/objects/pdf-object/classes/PdfObject.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`isModified`](../../../core/objects/pdf-object/classes/PdfObject.md#ismodified)

---

### setImmutable()

> **setImmutable**(`immutable`): `void`

Sets the immutable state of the object

#### Parameters

##### immutable

`boolean` = `true`

#### Returns

`void`

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`setImmutable`](../../../core/objects/pdf-object/classes/PdfObject.md#setimmutable)

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

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`setModified`](../../../core/objects/pdf-object/classes/PdfObject.md#setmodified)

---

### setPrev()

> **setPrev**(`xref`): `void`

Links this revision to a previous revision's cross-reference table.

#### Parameters

##### xref

The previous revision's xref lookup or revision

[`PdfXrefLookup`](../../pdf-xref-lookup/classes/PdfXrefLookup.md) | `PdfRevision`

#### Returns

`void`

---

### sortObjects()

> **sortObjects**(): `void`

Sorts objects by their insertion order.
Indirect objects are placed before other objects.

#### Returns

`void`

---

### toBytes()

> **toBytes**(): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts the object to a ByteArray, optionally padding to a specified length

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`toBytes`](../../../core/objects/pdf-object/classes/PdfObject.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`tokenize`](../../../core/objects/pdf-object/classes/PdfObject.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`toString`](../../../core/objects/pdf-object/classes/PdfObject.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`toTokens`](../../../core/objects/pdf-object/classes/PdfObject.md#totokens)

---

### unshift()

> **unshift**(...`objects`): `void`

Adds objects to the beginning of the revision's object list.

#### Parameters

##### objects

...[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Objects to add at the beginning

#### Returns

`void`

#### Throws

Error if the revision is locked

---

### update()

> **update**(): `void`

Updates the revision by sorting objects and updating the xref table.

#### Returns

`void`
