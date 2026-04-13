import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import { PdfFont } from '../fonts/pdf-font.js'
import { PdfDictionary, PdfHexadecimal, PdfNumber, PdfString } from '../core'
import { PdfPage } from '../pdf/pdf-page'
import { Matrix } from './geom/matrix'
import { Point } from './geom/point'
import { ByteArray } from '../types'
import { stringToBytes } from '../utils'
import { ContentOp } from './ops/base'
import { BeginTextOp, EndTextOp } from './ops/text'
import { PathOp } from './ops/path'
import { EndPathOp, ClipOp, ClipEvenOddOp, PaintOp } from './ops/paint'
import { ColorOp } from './ops/color'
import { SaveStateOp, RestoreStateOp, StateOp } from './ops/state'
import { PdfContentStreamTokeniser } from './tokeniser'
import { PdfToken } from '../core/tokens/token.js'
import {
    ContentNode,
    GraphicsBlock,
    StateNode,
    TextBlock,
    TextNode,
    VirtualTextBlock,
} from './nodes'

export {
    ContentNode,
    GraphicsBlock,
    StateNode,
    TextBlock,
    TextNode,
    VirtualTextBlock,
}

export class PdfContentStream extends PdfStream {
    _nodes: ContentNode[] | undefined
    /** @internal Root StateNode; preserves top-level ops (e.g. cm before q). */
    _rootNode: StateNode | undefined
    page?: PdfPage

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
    }

    get nodes(): ContentNode[] {
        if (!this._nodes) {
            this._nodes = this.parseNodes()
        }
        return this._nodes
    }

    /** Serialize the node tree back to a content-stream string. */
    private serializeNodes(): string {
        const parts: string[] = []
        // Emit root-level ops (e.g. cm transforms that appear before the
        // first q/BT).  These belong to the implicit root StateNode and
        // must NOT be wrapped in q/Q.
        if (this._rootNode) {
            for (const op of this._rootNode.ops) {
                parts.push(op.toString())
            }
        }
        if (this._nodes) {
            for (const n of this._nodes) {
                parts.push(n.toString())
            }
        }
        return parts.join('\n')
    }

    get dataAsString(): string {
        if (this._nodes) {
            return this.serializeNodes()
        }
        return super.dataAsString
    }

    set dataAsString(value: string) {
        this._nodes = undefined
        this._rootNode = undefined
        super.dataAsString = value
    }

    protected getRawData(): ByteArray | undefined {
        if (this._nodes === undefined) return undefined
        const contentString = this.serializeNodes()
        return stringToBytes(contentString)
    }

    protected tokenize(): PdfToken[] {
        const rawData = this.getRawData()
        if (rawData) {
            // Use the data setter so the bytes are properly re-encoded
            // through any existing filters (e.g. FlateDecode).
            this.data = rawData
        }
        return super.tokenize()
    }

    private parseNodes(): ContentNode[] {
        const contentString = this.dataAsString
        if (!contentString) return []

        const ops = PdfContentStreamTokeniser.tokenise(contentString)
        const root = PdfContentStream.buildNodeTree(ops, this.page)
        this._rootNode = root
        return root.getChildren()
    }

    static buildNodeTree(ops: ContentOp[], page?: PdfPage): StateNode {
        const root = new StateNode(page)
        const stateStack: StateNode[] = []

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
                textOps.push(op)
                inTextBlock = true
                continue
            }

            if (op instanceof EndTextOp) {
                textOps.push(op)
                inTextBlock = false
                // Only add non-empty text blocks
                const block = new TextBlock(page, textOps, lastTextBlock)
                if (block.getSegments().length > 0) {
                    currentState.addChild(block)
                    lastTextBlock = block
                }
                textOps = []
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

        // Preserve any stray graphics ops (e.g. color state ops that appear
        // before any paint op) as root-level ops so they round-trip correctly.
        if (graphicsOps.length > 0) {
            for (const op of graphicsOps) {
                currentState.ops.push(op)
            }
        }

        return root
    }
}

export class PdfContentStreamObject extends PdfIndirectObject<PdfContentStream> {
    static ContentNode = ContentNode
    static StateNode = StateNode
    static GraphicsBlock = GraphicsBlock
    static TextBlock = TextBlock

    private _page?: PdfPage

    get page(): PdfPage | undefined {
        return this._page
    }

    set page(value: PdfPage | undefined) {
        this._page = value
        this.content.page = value
    }

    constructor(object?: PdfIndirectObject) {
        super(object)

        if (!(object?.content instanceof PdfStream)) {
            throw new Error('Content stream object must have a stream content')
        }

        this.content = new PdfContentStream({
            header: object?.content?.header,
            original: object?.content?.raw,
        })
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

    get nodes(): ContentNode[] {
        return this.content.nodes
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
        return TextBlock.regroupTextBlocks(this.textBlocks)
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
}
