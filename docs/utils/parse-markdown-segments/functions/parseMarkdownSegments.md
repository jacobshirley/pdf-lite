[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/parse-markdown-segments](../README.md) / parseMarkdownSegments

# Function: parseMarkdownSegments()

> **parseMarkdownSegments**(`text`): [`StyledSegment`](../type-aliases/StyledSegment.md)[]

Parses a markdown string with **bold**, **bold**, _italic_, **_bold+italic_**,
and ~~strikethrough~~ syntax into an array of styled text segments.

Unrecognized or unmatched markers are emitted as plain text.

## Parameters

### text

`string`

## Returns

[`StyledSegment`](../type-aliases/StyledSegment.md)[]
