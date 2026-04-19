import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import { PdfArray, PdfDictionary } from '../core'
import { PdfPage } from '../pdf/pdf-page'
import { ByteArray } from '../types'
import { stringToBytes } from '../utils'
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

export {
    ContentNode,
    GraphicsBlock,
    StateNode,
    TextBlock,
    TextNode,
    VirtualTextBlock,
}

export class PdfContentStream extends PdfStream {
    page?: PdfPage
    private _originalOps: ContentOp[] = []
    private _cachedNodes?: ContentNode[]

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

    private parseOps(): void {
        const decoded = PdfStream.decode(
            super.raw,
            this.getFilters(),
            this.predictor,
        )

        this._originalOps = PdfContentStreamTokeniser.tokenise(decoded)
        this._cachedNodes = undefined // Clear cached nodes when re-parsing
    }

    get ops(): ContentOp[] {
        // If we have cached nodes, rebuild ops from the current node tree
        if (this._cachedNodes) {
            const result: ContentOp[] = []
            for (const node of this._cachedNodes) {
                this.flattenNode(node, result)
            }
            return result
        }
        // Otherwise return the original parsed ops
        return this._originalOps
    }

    override get raw(): ByteArray {
        const ops = this.ops
        const contentString = ops.reduce((acc, op) => acc + op.toString(), '')
        super.raw = PdfStream.encode(
            stringToBytes(contentString),
            this.getFilters(),
            this.predictor,
        )
        return super.raw
    }

    override set raw(value: ByteArray) {
        super.raw = value
        this.parseOps()
    }

    get nodes(): ContentNode[] {
        if (!this._cachedNodes) {
            this._cachedNodes = PdfContentStream.buildNodeTree(
                this._originalOps,
                this.page,
            ).getChildren()
        }
        return this._cachedNodes
    }

    /** Clear cached nodes - should be called when content is modified externally */
    invalidateNodeCache(): void {
        this._cachedNodes = undefined
    }

    private flattenNode(node: ContentNode, result: ContentOp[]): void {
        if (node instanceof StateNode) {
            // Check if this is a root-level state node (has no parent or parent is not StateNode)
            const shouldWrapWithSaveRestore = node.parent instanceof StateNode

            if (shouldWrapWithSaveRestore) {
                result.push(new SaveStateOp())
            }

            // Add the node's direct ops
            result.push(...node.ops)

            // Recursively add children
            for (const child of node.getChildren()) {
                this.flattenNode(child, result)
            }

            if (shouldWrapWithSaveRestore) {
                result.push(new RestoreStateOp())
            }
        } else {
            // For TextBlock, GraphicsBlock, etc., their ops getter handles the formatting
            result.push(...node.ops)
        }
    }

    static buildNodeTree(
        ops: ReadonlyArray<ContentOp>,
        page?: PdfPage,
    ): StateNode {
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
        // Clear cached nodes since we're modifying the content
        this.content.invalidateNodeCache()
        this.content.dataAsString += node.toString() + '\n'
    }

    get dataAsString(): string {
        return this.content.dataAsString
    }

    set dataAsString(value: string) {
        this.content.invalidateNodeCache()
        this.content.dataAsString = value
    }

    get ops(): ReadonlyArray<ContentOp> {
        return this.content.ops
    }

    get nodes(): ContentNode[] {
        // Set page on content stream if available
        if (this.page) {
            this.content.page = this.page
        }
        return this.content.nodes
    }

    get textBlocks(): TextBlock[] {
        return this.nodes.filter((n): n is TextBlock => n instanceof TextBlock)
    }

    get graphicsBlocks(): GraphicsBlock[] {
        return this.nodes.filter(
            (n): n is GraphicsBlock => n instanceof GraphicsBlock,
        )
    }
}

export class PdfContents extends PdfIndirectObject<
    PdfArray<PdfContentStreamObject>
> {
    private _page?: PdfPage
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
    }

    get page(): PdfPage | undefined {
        return this._page
    }

    set page(value: PdfPage) {
        for (const stream of this.content.items) {
            stream.page = value
        }
        this._page = value
    }

    get ops(): ReadonlyArray<ContentOp> {
        return this.content.items.flatMap((s) => s.ops)
    }

    get nodes(): ContentNode[] {
        const ops = this.ops
        const nodeTree = PdfContentStream.buildNodeTree(
            ops,
            this.page,
        ).getChildren()
        return nodeTree
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
}
