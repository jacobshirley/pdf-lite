import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfContentStreamObject } from './pdf-content-stream.js'
import { PdfFont } from '../fonts/pdf-font.js'
import { PdfDefaultAppearance } from '../acroform/fields/pdf-default-appearance.js'
import { PdfFormFieldFlags } from '../acroform/fields/pdf-form-field-flags.js'
import { SaveStateOp, RestoreStateOp } from './ops/state.js'
import { SetFillColorRGBOp, SetFillColorGrayOp } from './ops/color.js'
import { RectangleOp, MoveToOp, LineToOp, CurveToOp } from './ops/path.js'
import { FillOp } from './ops/paint.js'
import {
    BeginTextOp,
    EndTextOp,
    SetFontOp,
    MoveTextOp,
    ShowTextOp,
} from './ops/text.js'
import {
    BeginMarkedContentOp,
    EndMarkedContentOp,
} from './ops/marked-content.js'
import type { ContentOp } from './ops/base.js'
import { TextBlock, GraphicsBlock } from './nodes/index.js'

interface FontVariantNames {
    bold?: string
    italic?: string
    boldItalic?: string
}

interface TextFieldOptions {
    rect: [number, number, number, number]
    value: string
    da: PdfDefaultAppearance
    multiline: boolean
    comb: boolean
    maxLen: number | null
    fontResources?: PdfDictionary
    resolvedFonts?: Map<string, PdfFont>
    isUnicode?: boolean
    reverseEncodingMap?: Map<string, number>
    markdown?: string
    fontVariantNames?: FontVariantNames
    quadding?: number
}

interface ChoiceFieldOptions {
    rect: [number, number, number, number]
    value: string
    da: PdfDefaultAppearance
    flags: number | PdfFormFieldFlags
    fontResources?: PdfDictionary
    resolvedFonts?: Map<string, PdfFont>
    isUnicode?: boolean
    reverseEncodingMap?: Map<string, number>
    displayOptions?: string[]
    selectedIndex?: number
    quadding?: number
}

interface ButtonFieldOptions {
    width: number
    height: number
    contentStream?: string
}

function buttonResources(): PdfDictionary {
    const resources = new PdfDictionary()
    const fonts = new PdfDictionary()
    fonts.set('ZaDb', PdfFont.ZAPF_DINGBATS.reference)
    resources.set('Font', fonts)
    return resources
}

/**
 * Push a TextBlock's body ops (BT…ET) onto `dst`. When `strikes` is
 * provided its path ops are appended after ET (same graphics-state
 * group) so strikethrough strokes are painted over the text.
 */
function emitBlock(
    dst: ContentOp[],
    block: TextBlock,
    strikes?: GraphicsBlock,
): void {
    for (const op of block.materialize()) dst.push(op)
    if (strikes) {
        for (const op of strikes.ops) dst.push(op)
    }
}

/**
 * PDF appearance stream (Form XObject).
 *
 * Thin wrapper over `PdfContentStreamObject` that attaches the Form
 * XObject header dict (Type/Subtype/FormType/BBox/Resources).  The
 * static field factories delegate layout to `TextBlock`/`GraphicsBlock`
 * builders and emit typed content-stream ops directly (no string
 * concatenation on the caller side).
 */
export class PdfAppearanceStream extends PdfContentStreamObject {
    constructor(options: {
        x?: number
        y?: number
        width?: number
        height?: number
        contentStream?: string
        resources?: PdfDictionary
    }) {
        const appearanceDict = new PdfDictionary()
        appearanceDict.set('Type', new PdfName('XObject'))
        appearanceDict.set('Subtype', new PdfName('Form'))
        appearanceDict.set('FormType', new PdfNumber(1))
        appearanceDict.set(
            'BBox',
            new PdfArray([
                new PdfNumber(options.x ?? 0),
                new PdfNumber(options.y ?? 0),
                new PdfNumber(options.width ?? 100),
                new PdfNumber(options.height ?? 100),
            ]),
        )

        if (options.resources) {
            appearanceDict.set('Resources', options.resources)
        }

        const stream = new PdfStream({
            header: appearanceDict,
            original: options.contentStream ?? '',
        })

        super(new PdfIndirectObject({ content: stream }))
    }

    get contentStream(): string {
        return this.content.rawAsString
    }

    set contentStream(newContent: string) {
        this.content.rawAsString = newContent
    }

    /**
     * Text field appearance.  Dispatches between single-line, multiline,
     * comb, and markdown `TextBlock` builders based on the flags.
     */
    static textField(ctx: TextFieldOptions): PdfAppearanceStream {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1
        const stream = new PdfAppearanceStream({
            width,
            height,
            resources: ctx.fontResources,
        })

        const quadding = (ctx.quadding ?? 0) as 0 | 1 | 2
        const padding = 2

        let block: TextBlock
        let da: PdfDefaultAppearance
        let strikes: GraphicsBlock | undefined
        if (ctx.comb && ctx.maxLen) {
            ;({ block, da } = TextBlock.comb({
                text: ctx.value,
                width,
                height,
                maxLen: ctx.maxLen,
                da: ctx.da,
                padding,
                resolvedFonts: ctx.resolvedFonts,
            }))
        } else if (ctx.markdown) {
            ;({ block, da, strikes } = TextBlock.markdown({
                markdown: ctx.markdown,
                width,
                height,
                da: ctx.da,
                multiline: ctx.multiline,
                quadding,
                padding,
                resolvedFonts: ctx.resolvedFonts,
                fontVariantNames: ctx.fontVariantNames,
            }))
        } else if (ctx.multiline) {
            ;({ block, da } = TextBlock.multiline({
                text: ctx.value,
                width,
                height,
                da: ctx.da,
                quadding,
                padding,
                resolvedFonts: ctx.resolvedFonts,
                fontVariantNames: ctx.fontVariantNames,
            }))
        } else {
            ;({ block, da } = TextBlock.singleLine({
                text: ctx.value,
                width,
                height,
                da: ctx.da,
                quadding,
                padding,
                resolvedFonts: ctx.resolvedFonts,
            }))
        }

        const ops = stream.content.ops
        ops.push(BeginMarkedContentOp.create('Tx'))
        ops.push(new SaveStateOp())
        for (const op of da.toOps()) ops.push(op)
        emitBlock(ops, block, strikes)
        ops.push(new RestoreStateOp())
        ops.push(new EndMarkedContentOp())
        return stream
    }

    /** Choice field appearance (dropdowns, list boxes). */
    static choiceField(ctx: ChoiceFieldOptions): PdfAppearanceStream {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1
        const stream = new PdfAppearanceStream({
            width,
            height,
            resources: ctx.fontResources,
        })

        const padding = 2
        const availableWidth = width - 2 * padding
        const isCombo = new PdfFormFieldFlags(ctx.flags).combo
        const quadding = (ctx.quadding ?? 0) as 0 | 1 | 2
        const ops = stream.content.ops

        ops.push(BeginMarkedContentOp.create('Tx'))
        ops.push(new SaveStateOp())

        if (!isCombo && ctx.displayOptions && ctx.displayOptions.length > 0) {
            // Listbox: one row per option + optional highlight rect.
            const lineHeight = ctx.da.fontSize + 4
            const selectedIndex = ctx.selectedIndex ?? -1

            for (let i = 0; i < ctx.displayOptions.length; i++) {
                const itemY = height - (i + 1) * lineHeight
                if (itemY + lineHeight < 0) break

                if (i === selectedIndex) {
                    ops.push(new SaveStateOp())
                    ops.push(SetFillColorRGBOp.create(0.376, 0.62, 0.671))
                    ops.push(RectangleOp.create(0, itemY, width, lineHeight))
                    ops.push(new FillOp())
                    ops.push(new RestoreStateOp())
                }

                ops.push(...ctx.da.toOps())
                const row = TextBlock.row({
                    text: ctx.displayOptions[i],
                    baselineY: itemY + lineHeight * 0.25,
                    availableWidth,
                    padding,
                    da: ctx.da,
                    quadding,
                    resolvedFonts: ctx.resolvedFonts,
                })
                emitBlock(ops, row)
            }
        } else {
            // Combo / simple: single-line value (+ optional dropdown arrow).
            const { block, da } = TextBlock.singleLine({
                text: ctx.value,
                width,
                height,
                da: ctx.da,
                quadding,
                padding,
                resolvedFonts: ctx.resolvedFonts,
            })
            for (const op of da.toOps()) ops.push(op)
            emitBlock(ops, block)

            if (isCombo) {
                const arrowWidth = height * 0.8
                const arrowX = width - arrowWidth - 2
                const arrowY = height / 2
                const arrowSize = height * 0.3
                ops.push(new SaveStateOp())
                ops.push(SetFillColorGrayOp.create(0.5))
                ops.push(
                    MoveToOp.create(
                        arrowX + arrowWidth / 2,
                        arrowY - arrowSize / 3,
                    ),
                )
                ops.push(
                    LineToOp.create(
                        arrowX + arrowWidth / 2 - arrowSize / 2,
                        arrowY + arrowSize / 3,
                    ),
                )
                ops.push(
                    LineToOp.create(
                        arrowX + arrowWidth / 2 + arrowSize / 2,
                        arrowY + arrowSize / 3,
                    ),
                )
                ops.push(new FillOp())
                ops.push(new RestoreStateOp())
            }
        }

        ops.push(new RestoreStateOp())
        ops.push(new EndMarkedContentOp())
        return stream
    }

    /** Empty button-field scaffold with ZaDb font resource. */
    static buttonField(opts: ButtonFieldOptions): PdfAppearanceStream {
        return new PdfAppearanceStream({
            width: opts.width,
            height: opts.height,
            contentStream: opts.contentStream ?? '',
            resources: buttonResources(),
        })
    }

    /** Button "Yes"/On appearance — radio dot or ZaDb checkmark. */
    static buttonYesField(
        width: number,
        height: number,
        flags: number | PdfFormFieldFlags,
    ): PdfAppearanceStream {
        const size = Math.min(width, height)
        const isRadio = new PdfFormFieldFlags(flags).radio
        const stream = PdfAppearanceStream.buttonField({ width, height })
        const ops = stream.content.ops

        if (isRadio) {
            const center = size / 2
            const radius = size * 0.35
            const k = 0.5522847498
            const kRadius = k * radius

            ops.push(new SaveStateOp())
            ops.push(SetFillColorRGBOp.create(0, 0, 0))
            ops.push(MoveToOp.create(center, center + radius))
            ops.push(
                CurveToOp.create(
                    center + kRadius,
                    center + radius,
                    center + radius,
                    center + kRadius,
                    center + radius,
                    center,
                ),
            )
            ops.push(
                CurveToOp.create(
                    center + radius,
                    center - kRadius,
                    center + kRadius,
                    center - radius,
                    center,
                    center - radius,
                ),
            )
            ops.push(
                CurveToOp.create(
                    center - kRadius,
                    center - radius,
                    center - radius,
                    center - kRadius,
                    center - radius,
                    center,
                ),
            )
            ops.push(
                CurveToOp.create(
                    center - radius,
                    center + kRadius,
                    center - kRadius,
                    center + radius,
                    center,
                    center + radius,
                ),
            )
            ops.push(new FillOp())
            ops.push(new RestoreStateOp())
        } else {
            const checkSize = size * 0.65
            const offset = (size - checkSize) / 2
            ops.push(new SaveStateOp())
            ops.push(new BeginTextOp())
            ops.push(SetFontOp.create('ZaDb', checkSize))
            ops.push(MoveTextOp.create(offset, offset))
            ops.push(ShowTextOp.create(new PdfString('4')))
            ops.push(new EndTextOp())
            ops.push(new RestoreStateOp())
        }

        return stream
    }
}
