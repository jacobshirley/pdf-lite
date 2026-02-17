# AcroForm/XFA Refactoring Plan

## Context

The current `acroform.ts` is a 2163-line monolith containing both `PdfAcroForm` and `PdfAcroFormField`, with inline appearance generation, XFA dataset building, and no field type hierarchy. XFA lives in a separate top-level `src/xfa/` folder despite being accessed through the AcroForm dictionary.

Additionally, PDF annotations (a broader concept than form fields) have no dedicated module. Widget annotations - the visual representation of form fields on pages - are currently merged into the form field class. In the PDF spec, annotations are their own concept with shared properties (Rect, flags, appearance streams, page reference) that widget annotations inherit from.

This refactoring breaks everything into small, focused classes that map directly to PDF concepts, inspired by iText's architecture, and introduces a proper annotation hierarchy.

## Target Structure

```
src/annotations/
├── index.ts                          # Barrel exports
├── PdfAnnotation.ts                  # Base annotation class (Rect, F flags, AP, page ref)
├── PdfAnnotationFlags.ts             # Annotation flag accessors (print, hidden, locked, noZoom, etc.)
└── PdfWidgetAnnotation.ts            # Widget annotation subtype (extends PdfAnnotation)

src/acroform/
├── index.ts                          # Barrel exports (backward compatible)
├── manager.ts                        # PdfAcroFormManager (unchanged)
├── PdfAcroForm.ts                    # Form dictionary, field collection, write logic
├── PdfAnnotationWriter.ts            # Page Annots array management during write
├── PdfFontEncodingCache.ts           # Font encoding resolution and caching
├── fields/
│   ├── index.ts                      # Barrel + PdfFieldType + type aliases
│   ├── types.ts                      # FormContext interface, shared types
│   ├── PdfFormField.ts               # Base form field (extends PdfWidgetAnnotation)
│   ├── PdfFormFieldFlags.ts          # Field-specific Ff flag accessors (readOnly, required, multiline, etc.)
│   ├── PdfDefaultAppearance.ts       # DA string parser/builder
│   ├── PdfTextFormField.ts           # Text-specific (future expansion point)
│   ├── PdfButtonFormField.ts         # Button value setter (PdfName), checked state
│   ├── PdfChoiceFormField.ts         # Choice-specific (future expansion point)
│   ├── PdfSignatureFormField.ts      # Signature placeholder
│   └── PdfFormFieldFactory.ts        # Creates correct subtype from FT entry
├── appearance/
│   ├── index.ts
│   ├── AppearanceStreamBuilder.ts    # Shared: create Form XObject, resolve fonts
│   ├── TextAppearanceGenerator.ts    # Extracted from generateTextAppearance
│   ├── ButtonAppearanceGenerator.ts  # Extracted from generateButtonAppearance
│   └── ChoiceAppearanceGenerator.ts  # Extracted from generateChoiceAppearance
└── xfa/
    ├── index.ts
    ├── PdfXfaManager.ts              # Moved from src/xfa/manager.ts
    └── PdfXfaDatasets.ts             # Extracted XFA dataset building from PdfAcroForm
```

Delete `src/xfa/` folder entirely after moving.

## Class Hierarchy

```
PdfIndirectObject<PdfDictionary>
└── PdfAnnotation                    # Rect, annotation flags (F), AP, P (page ref)
    └── PdfWidgetAnnotation          # Widget-specific: isWidget, AS (appearance state)
        └── PdfFormField             # Form-specific: FT, V, DA, Ff, T (name), hierarchy
            ├── PdfTextFormField
            ├── PdfButtonFormField
            ├── PdfChoiceFormField
            └── PdfSignatureFormField
```

## Class Responsibilities

### Annotations module (`src/annotations/`)

| Class                   | Source                  | Responsibility                                                                                                                                                                    |
| ----------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PdfAnnotation**       | acroform.ts (extracted) | Base for all PDF annotations. Owns: `rect` (Rect), `annotationFlags` (F), `appearanceStreamDict` (AP), `parentRef` (P page reference). Extends `PdfIndirectObject<PdfDictionary>` |
| **PdfAnnotationFlags**  | acroform.ts:672-778     | Annotation flag accessors (F field bits): `invisible`, `hidden`, `print`, `noZoom`, `noRotate`, `noView`, `locked`                                                                |
| **PdfWidgetAnnotation** | acroform.ts:222-236     | Widget-specific properties: `isWidget` (Type/Subtype), `AS` (appearance state). Extends `PdfAnnotation`                                                                           |

### AcroForm module (`src/acroform/`)

| Class                         | Source                               | Responsibility                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PdfAcroForm**               | acroform.ts:1467-2162                | Form dictionary, field collection, `fromDocument()`, `write()`, import/export. Delegates font caching to `PdfFontEncodingCache`, page annotations to `PdfAnnotationWriter`, XFA to `PdfXfaDatasets`                              |
| **PdfFontEncodingCache**      | acroform.ts:1622-1817                | `getFontEncodingMap()`, `cacheAllFontEncodings()` - resolves font Encoding/Differences arrays and caches them                                                                                                                    |
| **PdfAnnotationWriter**       | acroform.ts:1819-1924                | `getPageAnnotsArray()`, `addFieldsToAnnots()`, `updatePageAnnotations()` - manages page Annots arrays during write                                                                                                               |
| **PdfFormField** (base)       | acroform.ts:56-976, 1406-1464        | Extends `PdfWidgetAnnotation`. Adds form-specific properties: `FT`, `V`, `DA`, `Ff`, `T` (name), field hierarchy (parent/children/siblings), appearance dispatch                                                                 |
| **PdfFormFieldFlags**         | acroform.ts:444-658                  | Field-specific Ff flag accessors: `readOnly`, `required`, `multiline`, `password`, `comb`, `combo`, `radio`, `noToggleToOff`, `pushButton`, `edit`, `sort`, `multiSelect`, `doNotSpellCheck`, `doNotScroll`, `commitOnSelChange` |
| **PdfDefaultAppearance**      | Duplicated across field + generators | Parses DA string (`/FontName Size Tf ColorOp`) into structured object. Builder methods: `withFontSize()`, `withFontName()`, `toString()`                                                                                         |
| **PdfButtonFormField**        | acroform.ts:313-323, 339-365         | Overrides `value` setter (uses `PdfName` + `AS`), `checked` get/set                                                                                                                                                              |
| **PdfTextFormField**          | Thin subclass                        | Type discriminator, future text-specific logic                                                                                                                                                                                   |
| **PdfChoiceFormField**        | Thin subclass                        | Type discriminator, future choice-specific logic                                                                                                                                                                                 |
| **PdfSignatureFormField**     | Thin subclass                        | Placeholder                                                                                                                                                                                                                      |
| **PdfFormFieldFactory**       | New (~50 lines)                      | Reads `FT` from dict (with parent inheritance), instantiates correct subclass                                                                                                                                                    |
| **AppearanceStreamBuilder**   | Shared boilerplate from generators   | `createFormXObject()`, `resolveFontResources()`                                                                                                                                                                                  |
| **TextAppearanceGenerator**   | acroform.ts:978-1165                 | Text field appearance (single-line, multiline, comb)                                                                                                                                                                             |
| **ButtonAppearanceGenerator** | acroform.ts:1171-1269                | Checkbox/radio appearance (ZapfDingbats, Bezier circles)                                                                                                                                                                         |
| **ChoiceAppearanceGenerator** | acroform.ts:1275-1399                | Dropdown/listbox appearance (text + combo arrow)                                                                                                                                                                                 |
| **PdfXfaDatasets**            | acroform.ts:1932-2049                | `build()` static method, `updateFieldValue()`, `escapeRegex()`                                                                                                                                                                   |
| **PdfXfaManager**             | Moved unchanged                      | `hasXfaForms()`, `readXml()`, `writeXml()`                                                                                                                                                                                       |

## Key Design Decisions

### Annotation hierarchy

Flags are split between two levels matching the PDF spec:

- **Annotation flags (F)** → `PdfAnnotationFlags` on `PdfAnnotation` - these are generic to all annotation types
- **Field flags (Ff)** → `PdfFormFieldFlags` on `PdfFormField` - these are specific to form fields

This means if you later add `PdfLinkAnnotation` or `PdfTextAnnotation`, they automatically get `print`, `hidden`, `locked`, etc. from `PdfAnnotation`.

### Circular dependency avoidance

`PdfFormField` needs form-level resources (DR, font encoding maps). Instead of importing `PdfAcroForm` directly, define an interface:

```typescript
// fields/types.ts
export interface FormContext {
    defaultResources: PdfDefaultResourcesDictionary | null
    fontEncodingMaps: Map<string, Map<number, string>>
    fields: PdfFormField[]
}
```

`PdfFormField.form` is typed as `FormContext`. `PdfAcroForm` implements it. No circular imports.

### PdfDefaultAppearance as a value object

DA string parsing is currently duplicated in: `fontSize` getter/setter, `fontName` getter/setter, `font` setter, and all 3 appearance generators. A small value object eliminates this:

```typescript
// PdfDefaultAppearance.ts
export class PdfDefaultAppearance {
    constructor(
        public fontName: string,
        public fontSize: number,
        public colorOp: string,
    ) {}

    static parse(da: string): PdfDefaultAppearance | null {
        /* parse /Font Size Tf color */
    }
    toString(): string {
        return `/${this.fontName} ${this.fontSize} Tf ${this.colorOp}`
    }
    withFontSize(size: number): PdfDefaultAppearance {
        /* return new instance */
    }
    withFontName(name: string): PdfDefaultAppearance {
        /* return new instance */
    }
}
```

### Appearance generators return streams, don't set them

Generators return `{ primary: PdfStream; secondary?: PdfStream } | null`. The base `generateAppearance()` method assigns the result to `_appearanceStream`/`_appearanceStreamYes`. This keeps private fields private.

### Backward compatible export alias

```typescript
export { PdfFormField as PdfAcroFormField } from './fields/PdfFormField.js'
```

### Field factory instantiation

Fields are instantiated via `PdfFormFieldFactory.create()` in `PdfAcroForm.fromDocument()`. The factory reads `FT` from the PDF dictionary (with parent fallback per PDF spec) and returns the correct subclass:

```typescript
static create(options: { other: PdfIndirectObject; form: FormContext; parent?: PdfFormField }): PdfFormField {
    let ft = dict.get('FT')?.value ?? options.parent?.content.get('FT')?.value
    switch (ft) {
        case 'Tx':  return new PdfTextFormField(options)
        case 'Btn': return new PdfButtonFormField(options)
        case 'Ch':  return new PdfChoiceFormField(options)
        case 'Sig': return new PdfSignatureFormField(options)
        default:    return new PdfFormField(options)
    }
}
```

## Migration Phases

### Phase 1: Create annotations module

1. Create `src/annotations/PdfAnnotation.ts` - base class with `rect`, `annotationFlags` (F), `appearanceStreamDict` (AP), `parentRef` (P)
2. Create `src/annotations/PdfAnnotationFlags.ts` - annotation flag accessors (`invisible`, `hidden`, `print`, `noZoom`, `noRotate`, `noView`, `locked`)
3. Create `src/annotations/PdfWidgetAnnotation.ts` - extends PdfAnnotation, adds `isWidget`, `AS`
4. Create `src/annotations/index.ts` barrel
5. Update `src/index.ts` to export annotations module
6. **Run tests** - no existing code uses these yet

### Phase 2: Extract appearance generators + PdfDefaultAppearance

1. Create `fields/PdfDefaultAppearance.ts` - DA string parser/builder value object
2. Create `appearance/AppearanceStreamBuilder.ts` with shared Form XObject creation and font resolution
3. Create `TextAppearanceGenerator.ts`, `ButtonAppearanceGenerator.ts`, `ChoiceAppearanceGenerator.ts`
4. Update `PdfAcroFormField.generateAppearance()` to delegate to generators
5. Update `fontSize`/`fontName`/`font` setters to use `PdfDefaultAppearance`
6. **Run tests** - no public API change

### Phase 3: Extract XFA datasets + move XFA manager

1. Create `xfa/PdfXfaDatasets.ts` with `build()` and `updateFieldValue()` statics
2. Move `src/xfa/manager.ts` → `src/acroform/xfa/PdfXfaManager.ts`
3. Create `src/acroform/xfa/index.ts` barrel
4. Update `PdfAcroForm.write()` to call `PdfXfaDatasets.build()`
5. Update import in `src/pdf/pdf-document.ts`
6. Delete `src/xfa/` directory
7. **Run tests**

### Phase 4: Extract PdfFontEncodingCache + PdfAnnotationWriter

1. Create `PdfFontEncodingCache.ts` - extract `getFontEncodingMap()` and `cacheAllFontEncodings()`
2. Create `PdfAnnotationWriter.ts` - extract `getPageAnnotsArray()`, `addFieldsToAnnots()`, `updatePageAnnotations()`
3. Update `PdfAcroForm` to delegate to both
4. **Run tests**

### Phase 5: Create field subclasses, flags, and factory

1. Create `fields/types.ts` with `FormContext` interface, `PdfFieldType`, type aliases
2. Create `fields/PdfFormFieldFlags.ts` - extract field-specific Ff flag accessors
3. Create `fields/PdfFormField.ts` - extends `PdfWidgetAnnotation`, add form properties, apply field flags, add `PdfAcroFormField` alias export
4. Create `PdfTextFormField`, `PdfButtonFormField` (override `value` setter + `checked`), `PdfChoiceFormField`, `PdfSignatureFormField`
5. Create `PdfFormFieldFactory.ts`
6. Create `fields/index.ts` barrel
7. **Run tests**

### Phase 6: Split PdfAcroForm and wire everything together

1. Extract `PdfAcroForm` class to `src/acroform/PdfAcroForm.ts`
2. Update `fromDocument()` to use `PdfFormFieldFactory.create()`
3. Update `src/acroform/index.ts` barrel to re-export from all new locations
4. Delete original `acroform.ts`
5. Update `manager.ts` imports
6. Update test imports if needed (or keep `acroform.ts` as a re-export shim)
7. **Run full test suite**

## Files to Modify

- `packages/pdf-lite/src/acroform/acroform.ts` → split and delete
- `packages/pdf-lite/src/acroform/index.ts` → update barrel exports
- `packages/pdf-lite/src/acroform/manager.ts` → update import path
- `packages/pdf-lite/src/index.ts` → add annotations export
- `packages/pdf-lite/src/xfa/` → move to `acroform/xfa/`, delete old folder
- `packages/pdf-lite/src/pdf/pdf-document.ts` → update XFA manager import
- `packages/pdf-lite/test/unit/acroform.test.ts` → update imports if needed
- `packages/pdf-lite/test/unit/xfa.test.ts` → update imports if needed

## New Files to Create

### Annotations module

- `src/annotations/index.ts`
- `src/annotations/PdfAnnotation.ts`
- `src/annotations/PdfAnnotationFlags.ts`
- `src/annotations/PdfWidgetAnnotation.ts`

### AcroForm module

- `src/acroform/PdfAcroForm.ts`
- `src/acroform/PdfAnnotationWriter.ts`
- `src/acroform/PdfFontEncodingCache.ts`
- `src/acroform/fields/types.ts`
- `src/acroform/fields/index.ts`
- `src/acroform/fields/PdfFormField.ts`
- `src/acroform/fields/PdfFormFieldFlags.ts`
- `src/acroform/fields/PdfDefaultAppearance.ts`
- `src/acroform/fields/PdfTextFormField.ts`
- `src/acroform/fields/PdfButtonFormField.ts`
- `src/acroform/fields/PdfChoiceFormField.ts`
- `src/acroform/fields/PdfSignatureFormField.ts`
- `src/acroform/fields/PdfFormFieldFactory.ts`
- `src/acroform/appearance/index.ts`
- `src/acroform/appearance/AppearanceStreamBuilder.ts`
- `src/acroform/appearance/TextAppearanceGenerator.ts`
- `src/acroform/appearance/ButtonAppearanceGenerator.ts`
- `src/acroform/appearance/ChoiceAppearanceGenerator.ts`
- `src/acroform/xfa/index.ts`
- `src/acroform/xfa/PdfXfaManager.ts`
- `src/acroform/xfa/PdfXfaDatasets.ts`

## Verification

1. Run `pnpm test` after each phase - all existing tests must pass
2. Verify no circular dependency warnings during TypeScript compilation (`pnpm compile`)
3. Check that the public API exports match the current surface (same names available from `src/acroform/index.ts`)
4. Verify the existing test PDFs fill correctly with the refactored code
