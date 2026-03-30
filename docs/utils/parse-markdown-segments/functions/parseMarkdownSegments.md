[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/parse-markdown-segments](../README.md) / parseMarkdownSegments

# Function: parseMarkdownSegments()

> **parseMarkdownSegments**(`text`): [`StyledSegment`](../type-aliases/StyledSegment.md)[]

Parses a markdown string with **bold**, _italic_, and **_bold+italic_**
syntax into an array of styled text segments.

Unrecognized or unmatched asterisks are emitted as plain text.

## Parameters

### text

`string`

## Returns

[`StyledSegment`](../type-aliases/StyledSegment.md)[]
