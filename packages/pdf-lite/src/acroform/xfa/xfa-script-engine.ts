/**
 * XFA Script Engine — extracts and executes initialization scripts
 * from XFA template XML using native Function constructor.
 *
 * Only processes `initialize` event scripts on fields.
 * Variable scripts (helper libraries) from ancestor subforms are
 * compiled into the execution context.
 */
import { XMLParser } from 'fast-xml-parser'
import {
    XfaFieldProxy,
    XfaHostProxy,
    XfaSubformProxy,
    type XfaScriptResult,
} from './xfa-script-proxies.js'

/** Script extracted from a field's initialize event */
interface FieldScript {
    fieldName: string
    fullPath: string
    code: string
    /** Variable script sources inherited from ancestor scopes */
    variableScripts: Map<string, string>
    /** Initial raw value from template or datasets */
    initialValue: string | null
}

/** Script extracted from a subform's variables block */
interface VariableScript {
    name: string
    code: string
}

function ensureArray<T>(val: T | T[] | undefined | null): T[] {
    if (val == null) return []
    return Array.isArray(val) ? val : [val]
}

/**
 * Execute XFA initialization scripts and return results keyed by field full path.
 *
 * @param templateXml - Raw XFA template XML string
 * @param datasetValues - Optional map of field path → value from datasets
 * @returns Map of field fullPath → script result
 */
export function executeXfaScripts(
    templateXml: string,
    datasetValues?: Map<string, string>,
): Map<string, XfaScriptResult> {
    const results = new Map<string, XfaScriptResult>()

    // Parse template XML
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
                'event',
                'script',
                'variables',
            ].includes(tagName),
        textNodeName: '#text',
        trimValues: false,
    })

    const parsed = parser.parse(templateXml)
    let templateRoot = parsed.template ?? parsed['xdp:xdp']?.template
    if (Array.isArray(templateRoot)) templateRoot = templateRoot[0]
    if (!templateRoot) return results

    // Collect all field initialize scripts with their scope
    const fieldScripts: FieldScript[] = []
    collectScripts(
        templateRoot,
        '',
        new Map<string, string>(),
        fieldScripts,
        datasetValues,
    )

    if (fieldScripts.length === 0) return results

    // Build shared host proxy
    const hostProxy = new XfaHostProxy()

    // Execute each field script
    for (const fs of fieldScripts) {
        try {
            const result = executeFieldScript(fs, hostProxy, templateRoot)
            if (result) {
                results.set(fs.fullPath, result)
            }
        } catch {
            // Graceful degradation — skip failed scripts
        }
    }

    return results
}

/**
 * Recursively walk the parsed XFA tree collecting:
 * 1. Variable scripts from subform > variables > script
 * 2. Initialize scripts from field > event[activity=initialize] > script
 */
function collectScripts(
    node: any,
    pathPrefix: string,
    parentVariables: Map<string, string>,
    out: FieldScript[],
    datasetValues?: Map<string, string>,
): void {
    if (!node || typeof node !== 'object') return

    const nodeName = node['@_name'] ?? ''
    const currentPath = pathPrefix
        ? nodeName
            ? `${pathPrefix}.${nodeName}`
            : pathPrefix
        : nodeName

    // Collect variable scripts at this scope level
    const scopeVariables = new Map(parentVariables)
    for (const vars of ensureArray(node.variables)) {
        for (const scr of ensureArray(vars?.script)) {
            const scrName =
                typeof scr === 'object' ? scr?.['@_name'] || '' : ''
            const code = typeof scr === 'string' ? scr : scr?.['#text'] || ''
            const contentType =
                typeof scr === 'object' ? scr?.['@_contentType'] || '' : ''

            if (scrName && code && contentType.includes('javascript')) {
                scopeVariables.set(scrName, code)
            }
        }
    }

    // Collect initialize scripts from fields
    for (const field of ensureArray(node.field)) {
        const fname = field?.['@_name'] ?? ''
        if (!fname) continue

        const fieldPath = currentPath ? `${currentPath}.${fname}` : fname

        for (const evt of ensureArray(field?.event)) {
            if (evt?.['@_activity'] !== 'initialize') continue
            for (const scr of ensureArray(evt?.script)) {
                const code =
                    typeof scr === 'string' ? scr : scr?.['#text'] || ''
                const contentType =
                    typeof scr === 'object'
                        ? scr?.['@_contentType'] || ''
                        : ''
                if (code && contentType.includes('javascript')) {
                    out.push({
                        fieldName: fname,
                        fullPath: fieldPath,
                        code,
                        variableScripts: new Map(scopeVariables),
                        initialValue:
                            datasetValues?.get(fieldPath) ?? null,
                    })
                }
            }
        }
    }

    // Collect from exclGroup fields
    for (const group of ensureArray(node.exclGroup)) {
        const groupName = group?.['@_name'] ?? ''
        const groupPath = currentPath
            ? groupName
                ? `${currentPath}.${groupName}`
                : currentPath
            : groupName

        for (const field of ensureArray(group?.field)) {
            const fname = field?.['@_name'] ?? ''
            if (!fname) continue
            const fieldPath = groupPath ? `${groupPath}.${fname}` : fname

            for (const evt of ensureArray(field?.event)) {
                if (evt?.['@_activity'] !== 'initialize') continue
                for (const scr of ensureArray(evt?.script)) {
                    const code =
                        typeof scr === 'string' ? scr : scr?.['#text'] || ''
                    const contentType =
                        typeof scr === 'object'
                            ? scr?.['@_contentType'] || ''
                            : ''
                    if (code && contentType.includes('javascript')) {
                        out.push({
                            fieldName: fname,
                            fullPath: fieldPath,
                            code,
                            variableScripts: new Map(scopeVariables),
                            initialValue:
                                datasetValues?.get(fieldPath) ?? null,
                        })
                    }
                }
            }
        }
    }

    // Recurse into child subforms
    for (const sf of ensureArray(node.subform)) {
        collectScripts(sf, currentPath, scopeVariables, out, datasetValues)
    }

    // Recurse into areas
    for (const area of ensureArray(node.area)) {
        collectScripts(area, currentPath, scopeVariables, out, datasetValues)
    }
}

/**
 * Execute a single field's initialize script using Function constructor.
 */
function executeFieldScript(
    fs: FieldScript,
    hostProxy: XfaHostProxy,
    templateRoot: any,
): XfaScriptResult | null {
    // Create field proxy as `this`
    const fieldProxy = new XfaFieldProxy(
        fs.fieldName,
        fs.fullPath,
        fs.initialValue,
    )

    // Build the sandbox context
    const sandbox: Record<string, any> = {}

    // Add variable scripts as callable objects
    // Each variable script defines functions, so we eval it and expose the module
    for (const [varName, varCode] of fs.variableScripts) {
        try {
            // Wrap the variable script in an object that exposes its functions
            const moduleCode = `(function() {
                var module = {};
                ${varCode}
                // Collect all function declarations into module
                var _exports = {};
                ${extractFunctionNames(varCode)
                    .map((fn) => `try { _exports.${fn} = ${fn}; } catch(e) {}`)
                    .join('\n')}
                return _exports;
            })()`

            const func = new Function(
                'xfa',
                'Date',
                'Array',
                'Math',
                'String',
                'Number',
                'parseInt',
                'parseFloat',
                'isNaN',
                'isFinite',
                'escape',
                'unescape',
                'encodeURIComponent',
                'decodeURIComponent',
                `return ${moduleCode}`
            )

            const moduleResult = func(
                buildXfaGlobal(hostProxy, templateRoot),
                Date,
                Array,
                Math,
                String,
                Number,
                parseInt,
                parseFloat,
                isNaN,
                isFinite,
                escape,
                unescape,
                encodeURIComponent,
                decodeURIComponent,
            )
            sandbox[varName] = moduleResult
        } catch {
            // If variable script fails, provide empty stub
            sandbox[varName] = {}
        }
    }

    // Add XFA globals
    sandbox.xfa = buildXfaGlobal(hostProxy, templateRoot)
    sandbox.event = {
        target: { hostContainer: undefined },
        change: '',
        rc: true,
    }

    // Add subform proxies for scripts that check _OsobaFizyczna.count etc
    addSubformProxies(sandbox, templateRoot)

    // Standard JS globals
    sandbox.Date = Date
    sandbox.Array = Array
    sandbox.Math = Math
    sandbox.String = String
    sandbox.Number = Number
    sandbox.parseInt = parseInt
    sandbox.parseFloat = parseFloat
    sandbox.isNaN = isNaN
    sandbox.isFinite = isFinite
    sandbox.escape = escape
    sandbox.unescape = unescape
    sandbox.encodeURIComponent = encodeURIComponent
    sandbox.decodeURIComponent = decodeURIComponent
    sandbox.console = { log: () => {}, warn: () => {}, error: () => {} }

    // Execute the script with `this` bound to field proxy
    const func = new Function(
        ...Object.keys(sandbox),
        `return (function() { ${fs.code} }).call(this)`
    )

    func.call(fieldProxy, ...Object.values(sandbox))

    return fieldProxy.getResult()
}

/** Build the `xfa` global object with host and resolveNode stubs */
function buildXfaGlobal(hostProxy: XfaHostProxy, _templateRoot: any): any {
    return {
        host: hostProxy,
        event: {
            change: '',
            rc: true,
        },
        resolveNode(_somExpr: string): any {
            // Stub — returns a minimal proxy
            return new XfaFieldProxy('resolved', _somExpr)
        },
        data: {
            loadXML() {},
            saveXML() {
                return ''
            },
        },
        form: {},
        datasets: { data: {} },
    }
}

/**
 * Add subform proxies to the sandbox so scripts can check
 * things like `Podmiot1._OsobaFizyczna.count`
 */
function addSubformProxies(
    sandbox: Record<string, any>,
    templateRoot: any,
): void {
    // Walk top-level subforms and create proxies for named subforms
    for (const sf of ensureArray(templateRoot?.subform)) {
        addSubformProxiesRecursive(sandbox, sf, 0)
    }
}

function addSubformProxiesRecursive(
    parent: Record<string, any>,
    node: any,
    depth: number,
): void {
    if (!node || typeof node !== 'object' || depth > 4) return

    for (const child of ensureArray(node.subform)) {
        const name = child?.['@_name']
        if (!name) continue

        const proxy = new XfaSubformProxy(name, 1)
        // Add both `name` and `_name` (XFA uses _ prefix for instance managers)
        parent[name] = proxy
        parent[`_${name}`] = proxy

        // Also add nested field proxies so scripts like
        // `Podmiot1.OsobaFizyczna.NIP.rawValue` work
        const childObj: Record<string, any> = Object.create(proxy)
        for (const field of ensureArray(child.field)) {
            const fname = field?.['@_name']
            if (fname) {
                childObj[fname] = new XfaFieldProxy(fname, fname)
            }
        }
        // Recurse into nested subforms
        addSubformProxiesRecursive(childObj, child, depth + 1)

        parent[name] = childObj
        parent[`_${name}`] = childObj
        // Preserve count on the child object
        Object.defineProperty(childObj, 'count', { value: 1, writable: true })
        Object.defineProperty(childObj, 'setInstances', {
            value: () => {},
        })
        Object.defineProperty(childObj, 'addInstance', {
            value: () => {},
        })
        Object.defineProperty(childObj, 'removeInstance', {
            value: () => {},
        })
    }

    // Also add named fields directly on parent for scripts like `Rok.rawValue`
    for (const field of ensureArray(node.field)) {
        const fname = field?.['@_name']
        if (fname && !(fname in parent)) {
            parent[fname] = new XfaFieldProxy(fname, fname)
        }
    }

    // Add exclGroup fields
    for (const group of ensureArray(node.exclGroup)) {
        const gname = group?.['@_name']
        if (gname && !(gname in parent)) {
            parent[gname] = new XfaFieldProxy(gname, gname)
        }
    }
}

/**
 * Extract function names declared in a variable script.
 * Matches `function name(` patterns.
 */
function extractFunctionNames(code: string): string[] {
    const names: string[] = []
    const regex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
    let match
    while ((match = regex.exec(code)) !== null) {
        names.push(match[1])
    }
    return names
}
