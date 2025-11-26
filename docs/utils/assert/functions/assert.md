[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/assert](../README.md) / assert

# Function: assert()

> **assert**(`value`, `message?`): `asserts value`

Asserts that a value is truthy, throwing an error if it is not.

## Parameters

### value

`unknown`

The value to check.

### message?

`string`

Optional error message to throw if the assertion fails.

## Returns

`asserts value`

## Throws

Error if the value is falsy.

## Example

```typescript
assert(user !== null, 'User must be defined')
```
