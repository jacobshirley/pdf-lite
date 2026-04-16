[**pdf-lite**](../../README.md)

---

[pdf-lite](../../README.md) / [errors](../README.md) / PdfPasswordProtectedError

# Class: PdfPasswordProtectedError

Error thrown when a PDF is encrypted and the blank password
does not grant access. Callers should catch this and prompt
the user for a password, then retry with the `password` option.

## Extends

- `Error`

## Constructors

### Constructor

> **new PdfPasswordProtectedError**(`message?`): `PdfPasswordProtectedError`

#### Parameters

##### message?

`string`

#### Returns

`PdfPasswordProtectedError`

#### Overrides

`Error.constructor`
