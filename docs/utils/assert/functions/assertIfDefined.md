[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/assert](../README.md) / assertIfDefined

# Function: assertIfDefined()

> **assertIfDefined**(`value`, `condition`, `message?`): `asserts condition`

Conditionally asserts a condition only when a value is defined.
Does nothing if the value is undefined or null.

## Parameters

### value

`unknown`

The value to check for definedness.

### condition

`unknown`

The condition to assert if value is defined.

### message?

`string`

Optional error message to throw if the assertion fails.

## Returns

`asserts condition`

## Throws

Error if value is defined and condition is falsy.

## Example

```typescript
assertIfDefined(user, user?.age >= 18, 'User must be an adult')
```
