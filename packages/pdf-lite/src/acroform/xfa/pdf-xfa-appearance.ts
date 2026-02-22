import type { PdfAcroForm } from '../pdf-acro-form.js'
import type { PdfFormField } from '../fields/pdf-form-field.js'
import type { PdfXfaFieldLayout } from './pdf-xfa-template.js'
import { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'

/**
 * Generates AcroForm AP streams from XFA template layout data.
 *
 * For each XFA field layout this class:
 *  1. Finds the matching AcroForm widget by name (exact or suffix match).
 *  2. Sets a default appearance (DA) string when one is absent and the XFA
 *     template provides font information.
 *  3. Calls generateAppearance() so the widget has a rendereable AP stream.
 *
 * @example
 * ```ts
 * const template = await PdfXfaTemplate.fromDocument(document)
 * if (template) {
 *   const layouts = template.extractFieldLayouts()
 *   const acroForm = await document.acroForm.read()
 *   if (acroForm) PdfXfaAppearance.apply(layouts, acroForm)
 * }
 * ```
 */
export class PdfXfaAppearance {
    /**
     * Matches each layout entry to an AcroForm field, patches the DA if
     * missing, and triggers appearance generation.
     *
     * @param layouts  Field layout data extracted from the XFA template.
     * @param acroForm The AcroForm whose widget annotations will be updated.
     * @returns        The number of fields for which an appearance was generated.
     */
    static apply(layouts: PdfXfaFieldLayout[], acroForm: PdfAcroForm): number {
        // Build a fast lookup: fully-qualified name → field
        const byName = new Map<string, PdfFormField>()
        for (const field of acroForm.fields) {
            const n = field.name
            if (n) byName.set(n, field)
        }

        let count = 0

        for (const layout of layouts) {
            if (layout.type === 'Draw') continue // static content, skip

            // 1. Exact name match
            let field = byName.get(layout.name)

            // 2. Suffix / partial match (XFA path may be longer than AcroForm name)
            if (!field) {
                const leaf = layout.name.split('.').pop() ?? layout.name
                field = Array.from(byName.values()).find((f) => {
                    const fname = f.name
                    return fname === leaf || fname.endsWith('.' + leaf)
                })
            }

            if (!field || !field.rect) continue

            // Patch DA when the XFA template provides font information and the
            // field has no default appearance string yet.
            if (!field.defaultAppearance && layout.fontName) {
                const fontSize = layout.fontSize ?? 12
                const da = new PdfDefaultAppearance(
                    layout.fontName,
                    fontSize,
                    '0 g',
                )
                field.content.set('DA', da)
            }

            if (field.generateAppearance()) count++
        }

        return count
    }
}
