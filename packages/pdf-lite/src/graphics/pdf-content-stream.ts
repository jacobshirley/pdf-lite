import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import { PdfArray, PdfDictionary } from '../core'
import { PdfPage } from '../pdf/pdf-page'
import { ByteArray } from '../types'
import { stringToBytes } from '../utils'
import { PdfToken } from '../core/tokens/token'
import { ContentOp } from './ops/base'
import { BeginTextOp, EndTextOp } from './ops/text'
import { PathOp } from './ops/path'
import { EndPathOp, ClipOp, ClipEvenOddOp, PaintOp } from './ops/paint'
import { ColorOp } from './ops/color'
import { SaveStateOp, RestoreStateOp, StateOp } from './ops/state'
import { PdfContentStreamTokeniser } from './tokeniser'
import {
    ContentNode,
    GraphicsBlock,
    StateNode,
    TextBlock,
    TextNode,
    VirtualTextBlock,
} from './nodes'
import { ArraySegment, MultiArray } from '../utils/arrays'

export {
    ContentNode,
    GraphicsBlock,
    StateNode,
    TextBlock,
    TextNode,
    VirtualTextBlock,
}

export class PdfContentStream extends PdfStream {
    private _page?: PdfPage
    ops: ContentOp[] = []
    private _nodes?: ContentNode[]

    get page(): PdfPage | undefined {
        return this._page
    }

    set page(value: PdfPage | undefined) {
        this._page = value
        this._nodes = undefined
    }

    constructor(
        options:
            | {
                  header: PdfDictionary
                  original: ByteArray | string
                  isModified?: boolean
              }
            | ByteArray
            | string = '',
    ) {
        super(options)
        this.parseOps()
    }

    /** Lazily-parsed node tree over `this.ops`. */
    get nodes(): ContentNode[] {
        if (!this._nodes) {
            const backing = new MultiArray<ContentOp>([this.ops])
            this._nodes = PdfContents.buildNodeTree(
                this.ops,
                this.page,
                backing,
            ).getChildren()
        }
        return this._nodes
    }

    private parseOps(): void {
        const decoded = PdfStream.decode(
            super.raw,
            this.getFilters(),
            this.predictor,
        )

        this.ops = PdfContentStreamTokeniser.tokenise(decoded)
    }

    override get raw(): ByteArray {
        const ops = this.ops
        const contentString = ops
            .map((op) => {
                const s = op.toString()
                // Ensure each op ends with whitespace for correct re-parsing
                return s.endsWith('\n') || s.endsWith(' ') ? s : s + '\n'
            })
            .join('')
        super.raw = PdfStream.encode(
            stringToBytes(contentString),
            this.getFilters(),
            this.predictor,
        )
        return super.raw
    }

    override set raw(value: ByteArray) {
        super.raw = value
        this._nodes = undefined
        this.parseOps()
    }

    protected override tokenize(): PdfToken[] {
        // Force re-serialization from ops before tokenizing
        void this.raw
        return super.tokenize()
    }
}

export class PdfContentStreamObject extends PdfIndirectObject<PdfContentStream> {
    static ContentNode = ContentNode
    static StateNode = StateNode
    static GraphicsBlock = GraphicsBlock
    static TextBlock = TextBlock

    private _page?: PdfPage

    constructor(object?: PdfIndirectObject) {
        super(object)

        if (object && !(object.content instanceof PdfStream)) {
            throw new Error('Content stream object must have a stream content')
        }

        const src =
            object?.content instanceof PdfStream ? object.content : undefined
        this.content = new PdfContentStream({
            header: src?.header ?? new PdfDictionary(),
            original: src?.raw ?? '',
        })
    }

    get page(): PdfPage | undefined {
        return this._page
    }

    set page(value: PdfPage | undefined) {
        this._page = value
        this.content.page = value
    }

    textBlock(): TextBlock {
        const block = new TextBlock(this.page)
        return block
    }

    graphicsBlock(): GraphicsBlock {
        const block = new GraphicsBlock()
        block.page = this.page
        return block
    }

    add(node: ContentNode) {
        this.content.dataAsString += node.toString() + '\n'
    }

    get dataAsString(): string {
        return this.content.dataAsString
    }

    set dataAsString(value: string) {
        this.content.dataAsString = value
    }

    get ops(): Array<ContentOp> {
        return this.content.ops
    }

    get nodes(): ContentNode[] {
        return this.content.nodes
    }

    get textBlocks(): TextBlock[] {
        const collect = (nodes: ContentNode[]): TextBlock[] => {
            const result: TextBlock[] = []
            for (const node of nodes) {
                if (node instanceof TextBlock) result.push(node)
                else if (node instanceof StateNode)
                    result.push(...collect(node.getChildren()))
            }
            return result
        }
        return collect(this.nodes)
    }

    get graphicsBlocks(): GraphicsBlock[] {
        const collect = (nodes: ContentNode[]): GraphicsBlock[] => {
            const result: GraphicsBlock[] = []
            for (const node of nodes) {
                if (node instanceof GraphicsBlock) result.push(node)
                else if (node instanceof StateNode)
                    result.push(...collect(node.getChildren()))
            }
            return result
        }
        return collect(this.nodes)
    }
}

export class PdfContents extends PdfIndirectObject<
    PdfArray<PdfContentStreamObject>
> {
    private _page?: PdfPage
    nodes: ContentNode[] = []

    constructor(items?: PdfContentStreamObject[] | PdfIndirectObject) {
        super(
            items instanceof PdfIndirectObject
                ? items
                : {
                      content: new PdfArray(items),
                  },
        )

        if (!(this.content instanceof PdfArray)) {
            throw new Error('Contents object must have an array content')
        }

        for (const item of this.content.items) {
            item.becomes(PdfContentStreamObject)
        }

        this.parseNodes()
    }

    get ops(): MultiArray<ContentOp> {
        const allOps = this.content.items.map((stream) => stream.ops)
        return new MultiArray(allOps)
    }

    add(node: ContentNode): void {
        const stream = new PdfContentStreamObject()
        stream.page = this.page
        stream.add(node)
        this.content.items.push(stream)
        this.nodes.push(...stream.content.nodes)
    }

    private parseNodes(): void {
        const backing = this.ops
        this.nodes = PdfContents.buildNodeTree(
            [...backing],
            this.page,
            backing,
        ).getChildren()
    }

    get page(): PdfPage | undefined {
        return this._page
    }

    set page(value: PdfPage) {
        for (const stream of this.content.items) {
            stream.page = value
        }
        this._page = value
        this.parseNodes()
    }

    get textBlocks(): TextBlock[] {
        const collect = (nodes: ContentNode[]): TextBlock[] => {
            const result: TextBlock[] = []
            for (const node of nodes) {
                if (node instanceof TextBlock) result.push(node)
                else if (node instanceof StateNode) {
                    result.push(...collect(node.getChildren()))
                }
            }
            return result
        }
        // Return text blocks as-is for round-trip preservation
        // Users can call regroupTextBlocksByLine() explicitly if they want visual regrouping
        return collect(this.nodes)
    }

    /**
     * Regroup text blocks by visual line position.
     * This converts positioning operators (Td, TD) to absolute matrices (Tm) for each segment.
     */
    regroupTextBlocksByLine(): VirtualTextBlock[] {
        return VirtualTextBlock.regroupTextBlocks(this.textBlocks)
    }

    get graphicsBlocks(): GraphicsBlock[] {
        const collect = (nodes: ContentNode[]): GraphicsBlock[] => {
            const result: GraphicsBlock[] = []
            for (const node of nodes) {
                if (node instanceof GraphicsBlock) result.push(node)
                else if (node instanceof StateNode) {
                    result.push(...collect(node.getChildren()))
                }
            }
            return result
        }
        return collect(this.nodes)
    }

    get renderedText(): string {
        return this.textBlocks.map((b) => b.text).join('')
    }

    static buildNodeTree(
        ops: ContentOp[],
        page?: PdfPage,
        /** When supplied, TextBlocks are created as attached views over this
         *  backing array so that segment mutations flow through to the source. */
        backing?: MultiArray<ContentOp>,
    ): StateNode {
        const root = new StateNode(page)
        const stateStack: StateNode[] = []

        let btOp: BeginTextOp | undefined
        let textOps: ContentOp[] = []
        let graphicsOps: (PaintOp | PathOp | ColorOp)[] = []
        let currentState: StateNode = root
        let inTextBlock = false
        // Track the previous TextBlock so segments can inherit font state
        // across BT/ET boundaries without modifying the original ops.
        let lastTextBlock: TextBlock | undefined
        // Save/restore lastTextBlock along with the graphics state stack
        // so that q/Q correctly revert font inheritance across BT blocks.
        const textBlockStack: (TextBlock | undefined)[] = []

        for (const op of ops) {
            if (op instanceof BeginTextOp) {
                // Flush any stray graphics ops (e.g. color state) before BT
                for (const g of graphicsOps) currentState.ops.push(g)
                graphicsOps = []
                btOp = op
                textOps.push(op)
                inTextBlock = true
                continue
            }

            if (op instanceof EndTextOp) {
                textOps.push(op)
                inTextBlock = false
                // Build the TextBlock — attached if a backing array is
                // provided, otherwise detached (copies ops).
                let block: TextBlock
                if (backing && btOp) {
                    const segment = new ArraySegment<ContentOp>(
                        backing,
                        btOp,
                        op,
                        0, // include BT
                        1, // include ET
                    )
                    block = new TextBlock(segment, undefined, lastTextBlock)
                } else {
                    block = new TextBlock(page, textOps, lastTextBlock)
                }
                if (block.getSegments().length > 0) {
                    currentState.addChild(block)
                    lastTextBlock = block
                }
                textOps = []
                btOp = undefined
                continue
            }

            // If we're inside a text block, collect ALL ops (not just TextOps)
            // This includes marked content operators like BDC, EMC
            if (inTextBlock) {
                textOps.push(op)
                continue
            }

            if (op instanceof SaveStateOp) {
                // Flush any stray graphics ops before entering a new state
                for (const g of graphicsOps) currentState.ops.push(g)
                graphicsOps = []
                const group = new StateNode(page)
                currentState.addChild(group)
                stateStack.push(currentState)
                textBlockStack.push(lastTextBlock)
                currentState = group
                continue
            }

            if (op instanceof RestoreStateOp) {
                // Flush any stray graphics ops before restoring state
                for (const g of graphicsOps) currentState.ops.push(g)
                graphicsOps = []
                if (stateStack.length > 0) {
                    currentState = stateStack.pop()!
                    lastTextBlock = textBlockStack.pop()
                }
                continue
            }

            if (op instanceof StateOp) {
                currentState.ops.push(op)
                continue
            }

            // Outside text block: graphics
            if (op instanceof PaintOp) {
                graphicsOps.push(op)
                const gBlock = new GraphicsBlock(page, graphicsOps)
                currentState.addChild(gBlock)
                graphicsOps = []
            } else if (
                op instanceof PathOp ||
                op instanceof ColorOp ||
                op instanceof ClipOp ||
                op instanceof ClipEvenOddOp
            ) {
                graphicsOps.push(op)
            } else if (op instanceof EndPathOp) {
                graphicsOps = []
            } else {
                // Preserve all other ops (e.g. marked-content BDC/EMC,
                // XObject invocations, inline images, etc.) so they
                // round-trip faithfully through serialization.
                for (const g of graphicsOps) currentState.ops.push(g)
                graphicsOps = []
                currentState.ops.push(op)
            }
        }

        for (const op of graphicsOps) {
            currentState.ops.push(op)
        }

        return root
    }
}
