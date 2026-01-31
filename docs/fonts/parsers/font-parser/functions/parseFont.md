[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [fonts/parsers/font-parser](../README.md) / parseFont

# Function: parseFont()

> **parseFont**(`data`): [`FontParser`](../../../types/interfaces/FontParser.md)

Parses font files of various formats (TTF, OTF, WOFF).
Automatically detects the format and returns the appropriate parser.

## Parameters

### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

## Returns

[`FontParser`](../../../types/interfaces/FontParser.md)

## Example

```typescript
const fontData = readFileSync('myfont.woff')
const parser = parseFont(fontData)
const descriptor = parser.getFontDescriptor()
```
