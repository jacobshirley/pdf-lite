#!/usr/bin/env npx tsx
/**
 * Parses all AFM files in this directory and outputs JSON files.
 *
 * Usage:
 *   npx tsx parse-afm.ts
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'
import type {
    AfmBBox,
    AfmCharMetric,
    AfmKernPair,
    AfmFont,
} from '../src/fonts/types.js'

function parseBBox(parts: string[]): AfmBBox {
    return {
        llx: Number(parts[0]),
        lly: Number(parts[1]),
        urx: Number(parts[2]),
        ury: Number(parts[3]),
    }
}

function parseCharMetric(line: string): AfmCharMetric {
    const fields = line
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    let code = -1
    let wx = 0
    let name = ''
    let bbox: AfmBBox = { llx: 0, lly: 0, urx: 0, ury: 0 }
    const ligatures: Record<string, string> = {}

    for (const field of fields) {
        const parts = field.split(/\s+/)
        const key = parts[0]
        switch (key) {
            case 'C':
                code = Number(parts[1])
                break
            case 'WX':
                wx = Number(parts[1])
                break
            case 'N':
                name = parts[1]
                break
            case 'B':
                bbox = parseBBox(parts.slice(1))
                break
            case 'L':
                // L successor ligature
                ligatures[parts[1]] = parts[2]
                break
        }
    }

    const metric: AfmCharMetric = { code, wx, name, bbox }
    if (Object.keys(ligatures).length > 0) {
        metric.ligatures = ligatures
    }
    return metric
}

function parseAfm(content: string): AfmFont {
    const lines = content.split('\n')
    const metadata: Record<string, string | number | boolean> = {}
    const charMetrics: AfmCharMetric[] = []
    const kernPairs: AfmKernPair[] = []
    let bbox: AfmBBox = { llx: 0, lly: 0, urx: 0, ury: 0 }

    let section: 'top' | 'charmetrics' | 'kernpairs' | 'other' = 'top'

    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('Comment')) continue

        // Section transitions
        if (trimmed.startsWith('StartCharMetrics')) {
            section = 'charmetrics'
            continue
        }
        if (trimmed === 'EndCharMetrics') {
            section = 'top'
            continue
        }
        if (trimmed.startsWith('StartKernPairs')) {
            section = 'kernpairs'
            continue
        }
        if (trimmed === 'EndKernPairs') {
            section = 'top'
            continue
        }
        if (
            trimmed.startsWith('StartKernData') ||
            trimmed === 'EndKernData' ||
            trimmed === 'StartFontMetrics 4.1' ||
            trimmed === 'EndFontMetrics'
        ) {
            continue
        }

        // Parse by section
        if (section === 'charmetrics') {
            if (trimmed.startsWith('C ') || trimmed.startsWith('C -1')) {
                charMetrics.push(parseCharMetric(trimmed))
            }
            continue
        }

        if (section === 'kernpairs') {
            if (trimmed.startsWith('KPX ')) {
                const parts = trimmed.split(/\s+/)
                kernPairs.push({
                    left: parts[1],
                    right: parts[2],
                    dx: Number(parts[3]),
                })
            }
            continue
        }

        // Top-level metadata
        const spaceIdx = trimmed.indexOf(' ')
        if (spaceIdx === -1) continue
        const key = trimmed.substring(0, spaceIdx)
        const value = trimmed.substring(spaceIdx + 1).trim()

        if (key === 'FontBBox') {
            bbox = parseBBox(value.split(/\s+/))
            continue
        }

        // Coerce known numeric/boolean fields
        const numericKeys = new Set([
            'ItalicAngle',
            'UnderlinePosition',
            'UnderlineThickness',
            'CapHeight',
            'XHeight',
            'Ascender',
            'Descender',
            'StdHW',
            'StdVW',
        ])
        const boolKeys = new Set(['IsFixedPitch'])

        if (numericKeys.has(key)) {
            metadata[key] = Number(value)
        } else if (boolKeys.has(key)) {
            metadata[key] = value === 'true'
        } else {
            metadata[key] = value
        }
    }

    return { metadata, bbox, charMetrics, kernPairs }
}

// Main
const dir = resolve(import.meta.dirname, '../vendor/Adobe/Core14')
const outDir = resolve(dir, '../src/fonts/vendor/Adobe/Core14')
mkdirSync(outDir, { recursive: true })

const afmFiles = readdirSync(dir).filter((f) => f.endsWith('.afm'))

for (const file of afmFiles) {
    const content = readFileSync(join(dir, file), 'utf-8')
    const parsed = parseAfm(content)
    const outName = basename(file, '.afm') + '.json'
    writeFileSync(join(outDir, outName), JSON.stringify(parsed, null, 2) + '\n')
    console.log(
        `${file} -> ${outName} (${parsed.charMetrics.length} chars, ${parsed.kernPairs.length} kern pairs)`,
    )
}
