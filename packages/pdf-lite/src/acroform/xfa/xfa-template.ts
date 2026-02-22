import { XMLParser } from 'fast-xml-parser'

/** Unit conversion factors to PDF points */
const UNIT_TO_PT: Record<string, number> = {
    pt: 1,
    in: 72,
    mm: 72 / 25.4,
    cm: 72 / 2.54,
}

/** Parse a measurement string like "10mm" or "2.5in" into PDF points */
function parseMeasurement(value: string | undefined | null): number {
    if (!value) return 0
    const str = String(value).trim()
    const match = str.match(/^(-?\d+(?:\.\d+)?)\s*(mm|cm|in|pt)?$/)
    if (!match) return 0
    const num = parseFloat(match[1])
    const unit = match[2] || 'pt'
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
}

export interface XfaPageDef {
    width: number
    height: number
    fields: XfaFieldDef[]
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

        // Create initial page defs — more may be added during walk if needed
        const pages: XfaPageDef[] = geometries.map((g) => ({
            width: g.pageWidth,
            height: g.pageHeight,
            fields: [],
        }))

        // Walk subform tree
        for (const topSubform of topSubforms) {
            const ctx: WalkContext = {
                pages,
                geometries,
                currentPageIndex: 0,
            }
            walkNode(topSubform, '', 0, 0, ctx)
        }

        // Fallback: try fields on template root
        if (pages.every((p) => p.fields.length === 0)) {
            const ctx: WalkContext = {
                pages,
                geometries,
                currentPageIndex: 0,
            }
            walkNode(templateRoot, '', 0, 0, ctx)
        }

        return new PdfXfaTemplate(pages)
    }

    /** Get all field definitions across all pages */
    get allFields(): XfaFieldDef[] {
        return this.pages.flatMap((p) => p.fields)
    }
}

interface WalkContext {
    pages: XfaPageDef[]
    geometries: PageGeometry[]
    currentPageIndex: number
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

/** Check if a text field is multiline */
function isMultiline(fieldNode: any): boolean {
    const ui = fieldNode?.ui
    if (!ui) return false
    const uiNode = Array.isArray(ui) ? ui[0] : ui
    if (!hasChild(uiNode, 'textEdit')) return false
    const textEdit = uiNode.textEdit
    if (typeof textEdit !== 'object' || textEdit === null) return false
    const te = Array.isArray(textEdit) ? textEdit[0] : textEdit
    return te?.['@_multiLine'] === '1' || te?.['@_multiLine'] === 'true'
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

/** Extract background fill color from field border/fill */
function extractBgColor(fieldNode: any): [number, number, number] | null {
    const border = fieldNode?.border
    if (!border) return null
    const b = Array.isArray(border) ? border[0] : border
    const fill = b?.fill
    if (!fill || typeof fill !== 'object') return null
    const color = fill?.color
    if (!color) return null
    const c = Array.isArray(color) ? color[0] : color
    return parseXfaColor(c?.['@_value'])
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
    return parseMeasurement(node?.['@_h'])
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
        })
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
    for (const area of ensureArray(node.area)) {
        const areaX = localX + parseMeasurement(area['@_x'])
        const areaY = localY + parseMeasurement(area['@_y'])

        // Areas can contain fields, exclGroups, and subforms
        emitFields(ensureArray(area.field), currentPath, areaX, areaY, ctx)

        for (const group of ensureArray(area.exclGroup)) {
            const groupName = group['@_name'] ?? ''
            const groupPath = currentPath
                ? groupName
                    ? `${currentPath}.${groupName}`
                    : currentPath
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
            walkNode(child, currentPath, areaX, areaY, ctx)
        }
    }

    // Recurse into child subforms
    const subforms = ensureArray(node.subform)

    if (layout === 'tb') {
        // Top-to-bottom flow: stack children vertically
        let flowY = localY

        for (const child of subforms) {
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
    const multiline = isMultiline(field)
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
