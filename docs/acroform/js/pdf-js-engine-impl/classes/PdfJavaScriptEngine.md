[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/js/pdf-js-engine-impl](../README.md) / PdfJavaScriptEngine

# Class: PdfJavaScriptEngine

Default JavaScript engine that executes PDF JS actions via `new Function()`.

**Security note:** This engine runs PDF-sourced JavaScript with access to the
ambient JS environment (e.g. `globalThis`, constructors, network APIs). It is
NOT sandboxed and should only be used with trusted PDF documents. For untrusted
documents, provide your own `PdfJsEngine` implementation that evaluates code
in an isolated context (e.g. Node `vm`, a dedicated realm, or a Web Worker).

## Implements

- [`PdfJsEngine`](../../pdf-js-engine/interfaces/PdfJsEngine.md)

## Constructors

### Constructor

> **new PdfJavaScriptEngine**(`options?`): `PdfJavaScriptEngine`

#### Parameters

##### options?

[`PdfJavaScriptEngineOptions`](../interfaces/PdfJavaScriptEngineOptions.md)

#### Returns

`PdfJavaScriptEngine`

## Methods

### execute()

> **execute**(`code`, `event`): `void`

#### Parameters

##### code

`string`

##### event

[`PdfJsEvent`](../../pdf-js-engine/interfaces/PdfJsEvent.md)

#### Returns

`void`

#### Implementation of

[`PdfJsEngine`](../../pdf-js-engine/interfaces/PdfJsEngine.md).[`execute`](../../pdf-js-engine/interfaces/PdfJsEngine.md#execute)
