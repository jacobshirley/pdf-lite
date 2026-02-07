[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/ref](../README.md) / Ref

# Class: Ref\<T\>

A mutable reference wrapper that supports value updates and change notifications.
Can hold a direct value or reference another Ref, forming reference chains.

## Example

```typescript
const ref = new Ref(42)
ref.onUpdate((old, newVal) => console.log(`Changed from ${old} to ${newVal}`))
ref.update(100) // Logs: Changed from 42 to 100
```

## Type Parameters

### T

`T`

The value type being referenced

## Constructors

### Constructor

> **new Ref**\<`T`\>(`value`): `Ref`\<`T`\>

Creates a new Ref with an initial value.

#### Parameters

##### value

The initial value or another Ref to chain

`T` | `Ref`\<`T`\>

#### Returns

`Ref`\<`T`\>

#### Throws

Error if attempting to create a self-referencing Ref

## Properties

### callbacks

> **callbacks**: [`RefUpdateCallback`](../type-aliases/RefUpdateCallback.md)\<`T`\>[] = `[]`

Registered callbacks for update notifications

---

### immutable

> `protected` **immutable**: `boolean` = `false`

---

### isModified

> **isModified**: `boolean` = `false`

---

### value

> **value**: `T` \| `Ref`\<`T`\>

The current value or a reference to another Ref

## Methods

### clone()

> **clone**(): `Ref`\<`T`\>

Creates a new Ref with the same resolved value.

#### Returns

`Ref`\<`T`\>

---

### equals()

> **equals**(`other?`): `boolean`

Compares this Ref's resolved value with another value or Ref.

#### Parameters

##### other?

The value or Ref to compare against

`T` | `Ref`\<`T`\>

#### Returns

`boolean`

True if the resolved values are equal

---

### isImmutable()

> **isImmutable**(): `boolean`

#### Returns

`boolean`

---

### onUpdate()

> **onUpdate**(`callback`): `void`

Registers a callback to be notified when the value changes.

#### Parameters

##### callback

[`RefUpdateCallback`](../type-aliases/RefUpdateCallback.md)\<`T`\>

The function to call on value updates

#### Returns

`void`

---

### resolve()

> **resolve**(): `T`

Resolves the reference chain to get the final value.

#### Returns

`T`

The resolved value of type T

---

### setImmutable()

> **setImmutable**(`immutable`): `void`

#### Parameters

##### immutable

`boolean` = `true`

#### Returns

`void`

---

### update()

> **update**(`newValue`): `void`

Updates the reference to a new value or another Ref.
Notifies all registered callbacks of the change.

#### Parameters

##### newValue

The new value or Ref to point to

`T` | `Ref`\<`T`\>

#### Returns

`void`
