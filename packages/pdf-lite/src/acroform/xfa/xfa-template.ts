import { XMLParser } from 'fast-xml-parser'

/** Unit conversion factors to PDF points */
const UNIT_TO_PT = {
    pt: 1,
    in: 72,
    mm: 72 / 25.4,
    cm: 72 / 2.54,
} as const

type Unit = keyof typeof UNIT_TO_PT

/** Parse a measurement string like "10mm" or "2.5in" into PDF points */
function parseMeasurement(value: string | undefined | null): number {
    if (!value) return 0
    const str = String(value).trim()
    const match = str.match(/^(-?\d+(?:\.\d+)?)\s*(mm|cm|in|pt)?$/)
    if (!match) return 0
    const num = parseFloat(match[1])
    const unit = (match[2] || 'pt') as Unit
    return num * (UNIT_TO_PT[unit] ?? 1)
}

/** XFA field type → PDF field type code */
type PdfFieldTypeCode = 'Tx' | 'Btn' | 'Ch' | 'Sig'

export interface XfaFieldDef {
    name: string
    fullPath: string
    type: PdfFieldTypeCode
    x: number
    y: number
    w: number
    h: number
    value: string
    multiline: boolean
    options: string[]
    /** Whether this is a combo (dropdown) vs listbox */
    combo: boolean
    /** Background fill color as [r, g, b] 0-1, or null if transparent */
    bgColor: [number, number, number] | null
    /** Border color as [r, g, b] 0-1, or null */
    borderColor: [number, number, number] | null
    /** Export values parallel to options (from script addItem calls) */
    exportValues?: string[]
    /** Whether the field is hidden (set by script execution) */
    hidden?: boolean
}

/** Static draw element (text label, rectangle, line) */
export interface XfaDrawDef {
    x: number
    y: number
    w: number
    h: number
    /** Text content, if any */
    text: string
    /** Font size in points */
    fontSize: number
    /** Font weight: 'bold' or 'normal' */
    fontWeight: string
    /** Fill/background color as [r,g,b] 0-1, or null */
    bgColor: [number, number, number] | null
    /** Border present and visible */
    hasBorder: boolean
}

export interface XfaPageDef {
    width: number
    height: number
    fields: XfaFieldDef[]
    draws: XfaDrawDef[]
}

/** Info extracted from pageArea for coordinate mapping */
interface PageGeometry {
    /** Full page width (from medium or pageArea) */
    pageWidth: number
    /** Full page height (from medium or pageArea) */
    pageHeight: number
    /** Content area X offset within the page */
    contentX: number
    /** Content area Y offset within the page */
    contentY: number
    /** Content area width */
    contentW: number
    /** Content area height */
    contentH: number
}

/**
 * Parsed XFA template intermediate representation.
 * Extracts field definitions and page geometry from XFA template XML.
 */
export class PdfXfaTemplate {
    pages: XfaPageDef[]

    constructor(pages: XfaPageDef[]) {
        this.pages = pages
    }

    /** Parse XFA template XML string into a PdfXfaTemplate */
    static parse(templateXml: string): PdfXfaTemplate {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            isArray: (tagName) =>
                [
                    'subform',
                    'field',
                    'draw',
                    'exclGroup',
                    'area',
                    'contentArea',
                    'pageArea',
                    'pageSet',
                    'items',
                    'text',
                    'item',
                ].includes(tagName),
            textNodeName: '#text',
            trimValues: false,
        })

        const parsed = parser.parse(templateXml)

        // Navigate into the template root
        let templateRoot = parsed.template ?? parsed['xdp:xdp']?.template
        if (Array.isArray(templateRoot)) templateRoot = templateRoot[0]
        if (!templateRoot) {
            templateRoot = findElement(parsed, 'template')
        }
        if (!templateRoot) return new PdfXfaTemplate([])

        // Collect page geometries from pageSet > pageArea
        const geometries: PageGeometry[] = []
        const topSubforms = ensureArray(templateRoot.subform)

        // Search for pageSet in template root and top subforms
        const allPageSets = [
            ...ensureArray(templateRoot.pageSet),
            ...topSubforms.flatMap((sf: any) => ensureArray(sf?.pageSet)),
        ]
        for (const ps of allPageSets) {
            for (const pa of ensureArray(ps?.pageArea)) {
                geometries.push(extractPageGeometry(pa))
            }
        }

        // Default if none found
        if (geometries.length === 0) {
            geometries.push({
                pageWidth: 612,
                pageHeight: 792,
                contentX: 0,
                contentY: 0,
                contentW: 612,
                contentH: 792,
            })
        }

        // Extract master page draws from pageArea (header/footer elements)
        const masterDraws: XfaDrawDef[] = []
        for (const ps of allPageSets) {
            for (const pa of ensureArray(ps?.pageArea)) {
                const geo = extractPageGeometry(pa)
                extractMasterPageDraws(pa, 0, 0, geo, masterDraws)
            }
        }

        // Create initial page defs — more may be added during walk if needed
        const pages: XfaPageDef[] = geometries.map((g) => ({
            width: g.pageWidth,
            height: g.pageHeight,
            fields: [],
            draws: [...masterDraws], // Master draws appear on every page
        }))

        // Walk subform tree
        for (const topSubform of topSubforms) {
            const ctx: WalkContext = {
                pages,
                geometries,
                currentPageIndex: 0,
                masterDraws,
            }
            walkNode(topSubform, '', 0, 0, ctx)
        }

        // Ensure all pages have draws array
        for (const page of pages) {
            if (!page.draws) page.draws = []
        }

        // Fallback: try fields on template root
        if (pages.every((p) => p.fields.length === 0)) {
            const ctx: WalkContext = {
                pages,
                geometries,
                currentPageIndex: 0,
                masterDraws,
            }
            walkNode(templateRoot, '', 0, 0, ctx)
        }

        return new PdfXfaTemplate(pages)
    }

    /** Get all field definitions across all pages */
    get allFields(): XfaFieldDef[] {
        return this.pages.flatMap((p) => p.fields)
    }

    /** Get all draw definitions across all pages */
    get allDraws(): XfaDrawDef[] {
        return this.pages.flatMap((p) => p.draws)
    }
}

interface WalkContext {
    pages: XfaPageDef[]
    geometries: PageGeometry[]
    currentPageIndex: number
    masterDraws: XfaDrawDef[]
}

/**
 * Extract draw elements from a pageArea (master page content).
 * These use page-absolute coordinates, NOT content-area-relative.
 */
function extractMasterPageDraws(
    pageArea: any,
    parentX: number,
    parentY: number,
    geo: PageGeometry,
    out: XfaDrawDef[],
): void {
    // Process draws directly on pageArea
    for (const draw of ensureArray(pageArea?.draw)) {
        if (isHidden(draw)) continue
        const def = makeMasterDrawDef(draw, parentX, parentY, geo)
        if (def) out.push(def)
    }

    // Process areas (recurse — the recursive call handles draws at each level)
    for (const area of ensureArray(pageArea?.area)) {
        if (isHidden(area)) continue
        const areaX = parentX + parseMeasurement(area['@_x'])
        const areaY = parentY + parseMeasurement(area['@_y'])
        extractMasterPageDraws(area, areaX, areaY, geo, out)
    }

    // Process subforms within pageArea
    for (const sf of ensureArray(pageArea?.subform)) {
        if (isHidden(sf)) continue
        extractMasterPageDraws(
            sf,
            parentX + parseMeasurement(sf['@_x']),
            parentY + parseMeasurement(sf['@_y']),
            geo,
            out,
        )
    }
}

/** Create a draw def for a master page element (page-absolute coordinates) */
function makeMasterDrawDef(
    draw: any,
    parentX: number,
    parentY: number,
    geo: PageGeometry,
): XfaDrawDef | null {
    if (!draw) return null

    const xfaX = parentX + parseMeasurement(draw['@_x'])
    const xfaY = parentY + parseMeasurement(draw['@_y'])
    const w = parseMeasurement(draw['@_w'])
    const h = parseMeasurement(draw['@_h']) || parseMeasurement(draw['@_minH'])

    if (w <= 0 && h <= 0) return null

    // Page-absolute: no content area offset needed, just flip Y
    const pdfX = xfaX
    const pdfY = geo.pageHeight - xfaY - h

    // Extract content (reuse same logic as body draws)
    let text = ''
    let rectBgColor: [number, number, number] | null = null
    let rectHasBorder = false

    const valueNode = draw?.value
    if (valueNode) {
        const v = Array.isArray(valueNode) ? valueNode[0] : valueNode
        const rect = v?.rectangle
        if (rect) {
            const r = Array.isArray(rect) ? rect[0] : rect
            const fill = r?.fill
            if (fill && typeof fill === 'object') {
                const color = fill?.color
                if (color) {
                    const c = Array.isArray(color) ? color[0] : color
                    rectBgColor = parseXfaColor(c?.['@_value'])
                }
            }
            const edge = r?.edge
            if (edge) {
                const e = Array.isArray(edge) ? edge[0] : edge
                if (e?.['@_presence'] !== 'hidden') rectHasBorder = true
            }
        }

        const textChild = v?.text
        if (textChild != null) {
            const t = Array.isArray(textChild) ? textChild[0] : textChild
            if (typeof t === 'string') text = t
            else if (t?.['#text'] !== undefined) text = String(t['#text'])
        }
        if (!text) {
            const exData = v?.exData
            if (exData != null) {
                const ex = Array.isArray(exData) ? exData[0] : exData
                text = extractExDataText(ex)
            }
        }
    }

    let fontSize = 7
    let fontWeight = 'normal'
    const fontNode = draw?.font
    if (fontNode) {
        const f = Array.isArray(fontNode) ? fontNode[0] : fontNode
        if (f?.['@_size']) fontSize = parseMeasurement(f['@_size'])
        if (f?.['@_weight'] === 'bold') fontWeight = 'bold'
    }

    const bgColor = rectBgColor ?? extractBgColor(draw)
    const hasBorder = rectHasBorder || extractHasBorder(draw)

    return {
        x: pdfX,
        y: pdfY,
        w,
        h,
        text,
        fontSize,
        fontWeight,
        bgColor,
        hasBorder,
    }
}

function extractPageGeometry(pageArea: any): PageGeometry {
    const contentAreas = ensureArray(pageArea?.contentArea)
    const medium = pageArea?.medium
    const mediumNode = Array.isArray(medium) ? medium[0] : medium

    // Page size from medium (actual paper size) or pageArea attributes or content area
    const pageWidth = parseMeasurement(
        mediumNode?.['@_short'] ?? pageArea?.['@_w'] ?? '8.5in',
    )
    const pageHeight = parseMeasurement(
        mediumNode?.['@_long'] ?? pageArea?.['@_h'] ?? '11in',
    )

    // Content area offset and size
    const ca = contentAreas[0]
    const contentX = parseMeasurement(ca?.['@_x'])
    const contentY = parseMeasurement(ca?.['@_y'])
    const contentW = ca ? parseMeasurement(ca['@_w']) : pageWidth
    const contentH = ca ? parseMeasurement(ca['@_h']) : pageHeight

    return { pageWidth, pageHeight, contentX, contentY, contentW, contentH }
}

function ensureArray<T>(val: T | T[] | undefined | null): T[] {
    if (val == null) return []
    return Array.isArray(val) ? val : [val]
}

function findElement(obj: any, name: string): any {
    if (!obj || typeof obj !== 'object') return undefined
    if (obj[name]) return Array.isArray(obj[name]) ? obj[name][0] : obj[name]
    for (const key of Object.keys(obj)) {
        const found = findElement(obj[key], name)
        if (found) return found
    }
    return undefined
}

/** Check if a key exists in the parsed node (handles empty elements parsed as "" or true) */
function hasChild(node: any, key: string): boolean {
    return node != null && key in node
}

/** Determine field type from the `<ui>` child element */
function getFieldType(fieldNode: any): {
    type: PdfFieldTypeCode
    combo: boolean
} {
    const ui = fieldNode?.ui
    if (!ui) return { type: 'Tx', combo: false }

    const uiNode = Array.isArray(ui) ? ui[0] : ui

    if (hasChild(uiNode, 'textEdit')) return { type: 'Tx', combo: false }
    if (hasChild(uiNode, 'numericEdit')) return { type: 'Tx', combo: false }
    if (hasChild(uiNode, 'dateTimeEdit')) return { type: 'Tx', combo: false }
    if (hasChild(uiNode, 'checkButton')) return { type: 'Btn', combo: false }
    if (hasChild(uiNode, 'choiceList')) {
        const choiceNode = Array.isArray(uiNode.choiceList)
            ? uiNode.choiceList[0]
            : uiNode.choiceList
        const open =
            typeof choiceNode === 'object' ? choiceNode?.['@_open'] : undefined
        return { type: 'Ch', combo: open !== 'always' }
    }
    if (hasChild(uiNode, 'signature')) return { type: 'Sig', combo: false }
    if (hasChild(uiNode, 'barcode')) return { type: 'Tx', combo: false }
    if (hasChild(uiNode, 'imageEdit')) return { type: 'Tx', combo: false }
    if (hasChild(uiNode, 'passwordEdit')) return { type: 'Tx', combo: false }

    return { type: 'Tx', combo: false }
}

/** 
 * Check if a text field should be multiline.
 * Returns true if:
 * 1. XFA explicitly sets multiLine="1", OR
 * 2. Field height suggests multiple lines (> 20pt, roughly 1.5 lines)
 */
function isMultiline(fieldNode: any, height: number): boolean {
    const ui = fieldNode?.ui
    if (!ui) return height > 20
    const uiNode = Array.isArray(ui) ? ui[0] : ui
    if (!hasChild(uiNode, 'textEdit')) return height > 20
    const textEdit = uiNode.textEdit
    if (typeof textEdit !== 'object' || textEdit === null) return height > 20
    const te = Array.isArray(textEdit) ? textEdit[0] : textEdit
    
    // Explicit multiLine attribute takes precedence
    if (te?.['@_multiLine'] === '1' || te?.['@_multiLine'] === 'true') {
        return true
    }
    
    // Otherwise, infer from field height (> 20pt suggests multiline intent)
    return height > 20
}

/** Extract options from items elements for choice fields */
function extractOptions(fieldNode: any): string[] {
    const options: string[] = []
    const itemsGroups = ensureArray(fieldNode?.items)
    const items = itemsGroups[0]
    if (!items) return options

    const textItems = ensureArray(items.text)
    for (const t of textItems) {
        if (typeof t === 'string') {
            options.push(t)
        } else if (t?.['#text'] !== undefined) {
            options.push(String(t['#text']))
        }
    }

    for (const tag of ['integer', 'float', 'decimal', 'date', 'time']) {
        for (const item of ensureArray(items[tag])) {
            if (typeof item === 'string' || typeof item === 'number') {
                options.push(String(item))
            } else if (item?.['#text'] !== undefined) {
                options.push(String(item['#text']))
            }
        }
    }

    return options
}

/** Parse XFA color value "R,G,B" (0-255) to [r,g,b] (0-1) */
function parseXfaColor(
    value: string | undefined | null,
): [number, number, number] | null {
    if (!value) return null
    const parts = value.split(',').map((s) => parseInt(s.trim(), 10))
    if (parts.length < 3 || parts.some(isNaN)) return null
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255]
}

/** Extract background fill color from node's border/fill or direct fill */
function extractBgColor(node: any): [number, number, number] | null {
    // Check border > fill > color (most common)
    const border = node?.border
    if (border) {
        const b = Array.isArray(border) ? border[0] : border
        const fill = b?.fill
        if (fill && typeof fill === 'object') {
            const color = fill?.color
            if (color) {
                const c = Array.isArray(color) ? color[0] : color
                const result = parseXfaColor(c?.['@_value'])
                if (result) return result
            }
        }
    }

    // Check direct fill > color on the node itself
    const directFill = node?.fill
    if (directFill && typeof directFill === 'object') {
        const df = Array.isArray(directFill) ? directFill[0] : directFill
        const color = df?.color
        if (color) {
            const c = Array.isArray(color) ? color[0] : color
            const result = parseXfaColor(c?.['@_value'])
            if (result) return result
        }
    }

    return null
}

/** Extract border edge color */
function extractBorderColor(fieldNode: any): [number, number, number] | null {
    const border = fieldNode?.border
    if (!border) return null
    const b = Array.isArray(border) ? border[0] : border
    const edge = b?.edge
    if (!edge) return null
    const e = Array.isArray(edge) ? edge[0] : edge
    if (e?.['@_presence'] === 'hidden') return null
    const color = e?.color
    if (!color) return null
    const c = Array.isArray(color) ? color[0] : color
    return parseXfaColor(c?.['@_value'])
}

/** Extract the default value from a field node */
function extractValue(fieldNode: any): string {
    const valueNode = fieldNode?.value
    if (!valueNode) return ''
    const v = Array.isArray(valueNode) ? valueNode[0] : valueNode

    for (const tag of [
        'text',
        'integer',
        'float',
        'decimal',
        'date',
        'time',
        'exData',
    ]) {
        const child = v?.[tag]
        if (child != null) {
            const c = Array.isArray(child) ? child[0] : child
            if (typeof c === 'string') return c
            if (typeof c === 'number') return String(c)
            if (c?.['#text'] !== undefined) return String(c['#text'])
        }
    }
    return ''
}

/** Get the height of a node, used for tb layout stacking */
function getNodeHeight(node: any): number {
    return parseMeasurement(node?.['@_h']) || parseMeasurement(node?.['@_minH'])
}

/** Check if a node is hidden (presence="hidden" or presence="inactive") */
function isHidden(node: any): boolean {
    const p = node?.['@_presence']
    return p === 'hidden' || p === 'inactive'
}

/**
 * Advance to next page. Adds a new page def if needed, reusing the
 * geometry template (cycling through available page geometries).
 */
function advancePage(ctx: WalkContext): void {
    ctx.currentPageIndex++
    // Add new page if we exceeded existing pages
    while (ctx.currentPageIndex >= ctx.pages.length) {
        const geoIdx = Math.min(ctx.currentPageIndex, ctx.geometries.length - 1)
        const g = ctx.geometries[geoIdx]
        ctx.pages.push({
            width: g.pageWidth,
            height: g.pageHeight,
            fields: [],
            draws: [...ctx.masterDraws],
        })
    }
}

/**
 * Process area elements recursively. Areas can contain fields, draws,
 * exclGroups, subforms, and nested areas.
 */
function processAreas(
    areas: any[],
    pathPrefix: string,
    parentX: number,
    parentY: number,
    ctx: WalkContext,
): void {
    for (const area of areas) {
        const areaX = parentX + parseMeasurement(area['@_x'])
        const areaY = parentY + parseMeasurement(area['@_y'])

        emitFields(ensureArray(area.field), pathPrefix, areaX, areaY, ctx)
        emitDraws(ensureArray(area.draw), areaX, areaY, ctx)

        for (const group of ensureArray(area.exclGroup)) {
            const groupName = group['@_name'] ?? ''
            const groupPath = pathPrefix
                ? groupName
                    ? `${pathPrefix}.${groupName}`
                    : pathPrefix
                : groupName
            const gx = areaX + parseMeasurement(group['@_x'])
            const gy = areaY + parseMeasurement(group['@_y'])
            for (const field of ensureArray(group.field)) {
                const fieldDef = makeFieldDef(field, groupPath, gx, gy, ctx)
                if (fieldDef) {
                    fieldDef.type = 'Btn'
                    addFieldToPage(fieldDef, ctx)
                }
            }
        }

        for (const child of ensureArray(area.subform)) {
            walkNode(child, pathPrefix, areaX, areaY, ctx)
        }

        // Recurse into nested areas
        processAreas(ensureArray(area.area), pathPrefix, areaX, areaY, ctx)
    }
}

/**
 * Recursively walk XFA nodes, handling flow layout and coordinate accumulation.
 *
 * @param node - Current XFA node
 * @param pathPrefix - Dotted path prefix for field names
 * @param parentX - Accumulated X offset in XFA coordinates (points)
 * @param parentY - Accumulated Y offset in XFA coordinates (points)
 * @param ctx - Walk context with pages and current page index
 */
function walkNode(
    node: any,
    pathPrefix: string,
    parentX: number,
    parentY: number,
    ctx: WalkContext,
): void {
    if (!node) return
    if (isHidden(node)) return

    const nodeName = node['@_name'] ?? ''
    const currentPath = pathPrefix
        ? nodeName
            ? `${pathPrefix}.${nodeName}`
            : pathPrefix
        : nodeName

    const layout = node['@_layout'] || 'position'

    // For positioned layout, add this node's x/y to parent offset
    const localX = parentX + parseMeasurement(node['@_x'])
    const localY = parentY + parseMeasurement(node['@_y'])

    // Process fields at this level
    emitFields(ensureArray(node.field), currentPath, localX, localY, ctx)

    // Process draw elements (static text, rectangles)
    emitDraws(ensureArray(node.draw), localX, localY, ctx)

    // Process exclusion groups
    for (const group of ensureArray(node.exclGroup)) {
        const groupName = group['@_name'] ?? ''
        const groupPath = currentPath
            ? groupName
                ? `${currentPath}.${groupName}`
                : currentPath
            : groupName
        const gx = localX + parseMeasurement(group['@_x'])
        const gy = localY + parseMeasurement(group['@_y'])

        const groupFields = ensureArray(group.field)
        for (const field of groupFields) {
            const fieldDef = makeFieldDef(field, groupPath, gx, gy, ctx)
            if (fieldDef) {
                fieldDef.type = 'Btn'
                addFieldToPage(fieldDef, ctx)
            }
        }
    }

    // Process areas (positioned grouping containers)
    processAreas(ensureArray(node.area), currentPath, localX, localY, ctx)

    // Recurse into child subforms
    const subforms = ensureArray(node.subform)

    if (layout === 'tb') {
        // Top-to-bottom flow: stack children vertically
        let flowY = localY

        for (const child of subforms) {
            // Skip hidden subforms entirely
            if (isHidden(child)) continue

            // Check for page break before
            if (hasPageBreakBefore(child)) {
                advancePage(ctx)
                flowY = 0 // reset Y for new page
            }

            walkNode(child, currentPath, localX, flowY, ctx)

            // Advance flow offset by child height
            flowY += getNodeHeight(child)

            // Check for page break after
            if (hasPageBreakAfter(child)) {
                advancePage(ctx)
                flowY = 0
            }
        }
    } else if (layout === 'lr-tb' || layout === 'lr') {
        // Left-to-right: simplified — just position each child
        for (const child of subforms) {
            if (hasPageBreakBefore(child)) {
                advancePage(ctx)
            }
            walkNode(child, currentPath, localX, localY, ctx)
            if (hasPageBreakAfter(child)) {
                advancePage(ctx)
            }
        }
    } else {
        // position layout (default) — children use their own x/y
        for (const child of subforms) {
            if (hasPageBreakBefore(child)) {
                advancePage(ctx)
            }
            walkNode(child, currentPath, localX, localY, ctx)
            if (hasPageBreakAfter(child)) {
                advancePage(ctx)
            }
        }
    }
}

function hasPageBreakBefore(node: any): boolean {
    const br = node?.break
    if (br) {
        const brNode = Array.isArray(br) ? br[0] : br
        if (
            brNode?.['@_before'] === 'pageArea' ||
            brNode?.['@_before'] === 'contentArea'
        )
            return true
    }
    if (node?.breakBefore) {
        const bb = Array.isArray(node.breakBefore)
            ? node.breakBefore[0]
            : node.breakBefore
        if (
            bb?.['@_targetType'] === 'pageArea' ||
            bb?.['@_targetType'] === 'contentArea'
        )
            return true
    }
    return false
}

function hasPageBreakAfter(node: any): boolean {
    const br = node?.break
    if (br) {
        const brNode = Array.isArray(br) ? br[0] : br
        if (
            brNode?.['@_after'] === 'pageArea' ||
            brNode?.['@_after'] === 'contentArea'
        )
            return true
    }
    if (node?.breakAfter) {
        const ba = Array.isArray(node.breakAfter)
            ? node.breakAfter[0]
            : node.breakAfter
        if (
            ba?.['@_targetType'] === 'pageArea' ||
            ba?.['@_targetType'] === 'contentArea'
        )
            return true
    }
    return false
}

function emitFields(
    fields: any[],
    pathPrefix: string,
    parentX: number,
    parentY: number,
    ctx: WalkContext,
): void {
    for (const field of fields) {
        const fieldDef = makeFieldDef(field, pathPrefix, parentX, parentY, ctx)
        if (fieldDef) {
            addFieldToPage(fieldDef, ctx)
        }
    }
}

function addFieldToPage(fieldDef: XfaFieldDef, ctx: WalkContext): void {
    const pageIdx = Math.min(ctx.currentPageIndex, ctx.pages.length - 1)
    if (pageIdx >= 0 && ctx.pages[pageIdx]) {
        ctx.pages[pageIdx].fields.push(fieldDef)
    }
}

function emitDraws(
    draws: any[],
    parentX: number,
    parentY: number,
    ctx: WalkContext,
): void {
    for (const draw of draws) {
        if (isHidden(draw)) continue
        const drawDef = makeDrawDef(draw, parentX, parentY, ctx)
        if (drawDef) {
            addDrawToPage(drawDef, ctx)
        }
    }
}

function addDrawToPage(drawDef: XfaDrawDef, ctx: WalkContext): void {
    const pageIdx = Math.min(ctx.currentPageIndex, ctx.pages.length - 1)
    if (pageIdx >= 0 && ctx.pages[pageIdx]) {
        ctx.pages[pageIdx].draws.push(drawDef)
    }
}

function makeDrawDef(
    draw: any,
    parentX: number,
    parentY: number,
    ctx: WalkContext,
): XfaDrawDef | null {
    if (!draw) return null

    const xfaX = parentX + parseMeasurement(draw['@_x'])
    const xfaY = parentY + parseMeasurement(draw['@_y'])
    const w = parseMeasurement(draw['@_w'])
    // Use @_h, fall back to @_minH (common for text draws)
    const h = parseMeasurement(draw['@_h']) || parseMeasurement(draw['@_minH'])

    // Skip draws with no dimensions at all
    if (w <= 0 && h <= 0) return null

    // Get page geometry for coordinate conversion
    const pageIdx = Math.min(ctx.currentPageIndex, ctx.pages.length - 1)
    const geoIdx = Math.min(pageIdx, ctx.geometries.length - 1)
    const geo = ctx.geometries[geoIdx]

    // Convert to PDF coordinates (same as fields)
    const pdfX = geo.contentX + xfaX
    const pdfY = geo.pageHeight - (geo.contentY + xfaY) - h

    // Extract content from value element
    let text = ''
    let rectBgColor: [number, number, number] | null = null
    let rectHasBorder = false

    const valueNode = draw?.value
    if (valueNode) {
        const v = Array.isArray(valueNode) ? valueNode[0] : valueNode

        // Check for rectangle element (colored background shapes)
        const rect = v?.rectangle
        if (rect) {
            const r = Array.isArray(rect) ? rect[0] : rect
            // Extract fill color from rectangle > fill > color
            const fill = r?.fill
            if (fill && typeof fill === 'object') {
                const color = fill?.color
                if (color) {
                    const c = Array.isArray(color) ? color[0] : color
                    rectBgColor = parseXfaColor(c?.['@_value'])
                }
            }
            // Rectangle edge = border
            const edge = r?.edge
            if (edge) {
                const e = Array.isArray(edge) ? edge[0] : edge
                if (e?.['@_presence'] !== 'hidden') rectHasBorder = true
            }
        }

        // Try text child
        const textChild = v?.text
        if (textChild != null) {
            const t = Array.isArray(textChild) ? textChild[0] : textChild
            if (typeof t === 'string') text = t
            else if (t?.['#text'] !== undefined) text = String(t['#text'])
        }
        // Try exData child (often contains XHTML body text)
        if (!text) {
            const exData = v?.exData
            if (exData != null) {
                const ex = Array.isArray(exData) ? exData[0] : exData
                text = extractExDataText(ex)
            }
        }
    }

    // Font info from font element
    let fontSize = 7
    let fontWeight = 'normal'
    const fontNode = draw?.font
    if (fontNode) {
        const f = Array.isArray(fontNode) ? fontNode[0] : fontNode
        if (f?.['@_size']) fontSize = parseMeasurement(f['@_size'])
        if (f?.['@_weight'] === 'bold') fontWeight = 'bold'
    }

    // Background: prefer rectangle fill, then border/fill, then direct fill
    const bgColor = rectBgColor ?? extractBgColor(draw)
    // Border: from rectangle edge, or from draw's border element
    const hasBorder = rectHasBorder || extractHasBorder(draw)

    return {
        x: pdfX,
        y: pdfY,
        w,
        h,
        text,
        fontSize,
        fontWeight,
        bgColor,
        hasBorder,
    }
}

/** Extract plain text from exData element (may contain XHTML body) */
function extractExDataText(exData: any): string {
    if (typeof exData === 'string') return exData
    if (exData?.['#text'] !== undefined) return String(exData['#text'])

    // XHTML body: look for body > p or just body text
    const body = exData?.body
    if (body) {
        const b = Array.isArray(body) ? body[0] : body
        if (typeof b === 'string') return b
        if (b?.['#text'] !== undefined) return String(b['#text'])

        // Check for <p> elements
        const paragraphs = ensureArray(b?.p)
        const parts: string[] = []
        for (const p of paragraphs) {
            if (typeof p === 'string') parts.push(p)
            else if (p?.['#text'] !== undefined) parts.push(String(p['#text']))
            else if (p?.span) {
                const spans = ensureArray(p.span)
                for (const s of spans) {
                    if (typeof s === 'string') parts.push(s)
                    else if (s?.['#text'] !== undefined)
                        parts.push(String(s['#text']))
                }
            }
        }
        if (parts.length > 0) return parts.join(' ')
    }

    return ''
}

/** Check if a node has a visible border */
function extractHasBorder(node: any): boolean {
    const border = node?.border
    if (!border) return false
    const b = Array.isArray(border) ? border[0] : border
    if (b?.['@_presence'] === 'hidden' || b?.['@_presence'] === 'inactive')
        return false
    const edge = b?.edge
    if (!edge) return false
    const e = Array.isArray(edge) ? edge[0] : edge
    if (e?.['@_presence'] === 'hidden') return false
    return true
}

function makeFieldDef(
    field: any,
    pathPrefix: string,
    parentX: number,
    parentY: number,
    ctx: WalkContext,
): XfaFieldDef | null {
    if (!field) return null

    const name = field['@_name'] ?? ''
    if (!name) return null

    const fullPath = pathPrefix ? `${pathPrefix}.${name}` : name

    // Field position relative to parent in XFA coordinates
    const xfaX = parentX + parseMeasurement(field['@_x'])
    const xfaY = parentY + parseMeasurement(field['@_y'])
    const w = parseMeasurement(field['@_w'])
    const h = parseMeasurement(field['@_h'])

    // Get page geometry for coordinate conversion
    const pageIdx = Math.min(ctx.currentPageIndex, ctx.pages.length - 1)
    const geoIdx = Math.min(pageIdx, ctx.geometries.length - 1)
    const geo = ctx.geometries[geoIdx]

    // Convert XFA coordinates to PDF coordinates:
    // XFA: (0,0) = top-left of content area, Y increases downward
    // PDF: (0,0) = bottom-left of page, Y increases upward
    // 1. Add content area offset to get absolute page position
    // 2. Flip Y axis
    const pdfX = geo.contentX + xfaX
    const pdfY = geo.pageHeight - (geo.contentY + xfaY) - h

    const { type, combo } = getFieldType(field)
    const value = extractValue(field)
    const multiline = isMultiline(field, h)
    const options = extractOptions(field)

    const bgColor = extractBgColor(field)
    const borderColor = extractBorderColor(field)

    return {
        name,
        fullPath,
        type,
        x: pdfX,
        y: pdfY,
        w,
        h,
        value,
        multiline,
        options,
        combo,
        bgColor,
        borderColor,
    }
}
