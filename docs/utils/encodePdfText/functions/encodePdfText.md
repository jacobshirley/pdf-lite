[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/encodePdfText](../README.md) / encodePdfText

# Function: encodePdfText()

> **encodePdfText**(`text`, `isUnicode`, `reverseEncodingMap?`): `string`

Encodes a text string for use in a PDF content stream text operator (`Tj`).

PDF literal strings `(...)` in content streams are raw bytes interpreted by the
font's encoding — NOT UTF-8. This function produces the correct PDF string token:

- Type0/Identity-H fonts: hex string `<XXXX...>` with 2 bytes per character (CID = Unicode codepoint)
- Single-byte fonts: PDF literal `(...)` with octal escapes `\ooo` for byte values ≥ 0x80,
  using the reverse encoding map when available for characters outside the Latin-1 range.

## Parameters

### text

`string`

The Unicode text to encode

### isUnicode

`boolean`

True if the font uses Type0/Identity-H encoding (2-byte CID per character)

### reverseEncodingMap?

`Map`\<`string`, `number`\>

Optional map from Unicode character to byte code,
derived by inverting the font's Differences-based encoding map

## Returns

`string`

A PDF string token ready to use before `Tj`, e.g. `<0050> Tj` or `(text) Tj`
