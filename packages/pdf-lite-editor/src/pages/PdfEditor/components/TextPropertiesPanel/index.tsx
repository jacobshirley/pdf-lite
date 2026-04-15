import React from 'react'
import { Badge } from '@/components/shadcn/badge'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent } from '@/components/shadcn/card'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import { Separator } from '@/components/shadcn/separator'
import { Trash2, Type, Upload, X } from 'lucide-react'
import type {
    ExtractedTextBlock,
    FontRef,
    TextSegmentDTO,
} from '../../types'

type Props = {
    textBlock: ExtractedTextBlock
    segments: TextSegmentDTO[]
    standardFonts: FontRef[]
    embeddedFonts: FontRef[]
    fontInputRef: React.RefObject<HTMLInputElement | null>
    onTextChange: (value: string) => void
    onFontChange: (fontRef: FontRef) => void
    onColorChange: (hex: string) => void
    onMove: (property: 'x' | 'y', value: string) => void
    onFontUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemove: () => void
    onClose: () => void
}

export function TextPropertiesPanel({
    textBlock,
    segments,
    standardFonts,
    embeddedFonts,
    fontInputRef,
    onTextChange,
    onFontChange,
    onColorChange,
    onMove,
    onFontUpload,
    onRemove,
    onClose,
}: Props) {
    const bbox = textBlock.bbox

    return (
        <Card className="sticky top-6 h-[calc(100vh-48px)] rounded-[24px] border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="flex h-full flex-col p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-slate-600" />
                        <h2 className="font-semibold text-sm">
                            Text Properties
                        </h2>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="tb-text"
                            className="text-xs font-semibold text-slate-700"
                        >
                            Text Content
                        </Label>
                        <textarea
                            id="tb-text"
                            value={textBlock.text}
                            onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>,
                            ) => onTextChange(e.target.value)}
                            className="w-full min-h-[60px] text-sm rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y"
                            rows={3}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700">
                            Font
                        </Label>
                        {segments.length > 0 &&
                            (() => {
                                const seg = segments[0]
                                const currentFontName =
                                    seg.fontName || 'Unknown'
                                const allFonts = [
                                    ...standardFonts,
                                    ...embeddedFonts,
                                ]
                                return (
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="tb-font-select"
                                                className="text-xs text-slate-600"
                                            >
                                                Font Family
                                            </Label>
                                            <select
                                                id="tb-font-select"
                                                value={currentFontName}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLSelectElement>,
                                                ) => {
                                                    const name = e.target.value
                                                    const chosen = allFonts.find(
                                                        (f) => f.name === name,
                                                    )
                                                    if (chosen) onFontChange(chosen)
                                                }}
                                                className="w-full h-8 text-sm rounded-md border border-slate-300 px-2 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                                            >
                                                <optgroup label="Standard Fonts">
                                                    {standardFonts.map((f) => (
                                                        <option
                                                            key={f.id}
                                                            value={f.name}
                                                        >
                                                            {f.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                                {embeddedFonts.length > 0 && (
                                                    <optgroup label="Uploaded Fonts">
                                                        {embeddedFonts.map((f) => (
                                                            <option
                                                                key={f.id}
                                                                value={f.name}
                                                            >
                                                                {f.name}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                                {!allFonts.some(
                                                    (f) =>
                                                        f.name ===
                                                        currentFontName,
                                                ) && (
                                                    <option
                                                        value={currentFontName}
                                                        disabled
                                                    >
                                                        {currentFontName} (current)
                                                    </option>
                                                )}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="tb-font-type"
                                                className="text-xs text-slate-600"
                                            >
                                                Font Type
                                            </Label>
                                            <Input
                                                id="tb-font-type"
                                                value={seg.fontType || 'Unknown'}
                                                disabled
                                                className="h-8 text-sm bg-slate-50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="tb-font-size"
                                                className="text-xs text-slate-600"
                                            >
                                                Font Size
                                            </Label>
                                            <Input
                                                id="tb-font-size"
                                                type="number"
                                                value={seg.fontSize}
                                                disabled
                                                className="h-8 text-sm bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                )
                            })()}
                        {segments.length > 1 && (
                            <div className="mt-2">
                                <Label className="text-xs text-slate-500">
                                    {segments.length} segments in this block
                                </Label>
                                <div className="mt-1 max-h-[120px] overflow-y-auto space-y-1">
                                    {segments.map((seg, i) => (
                                        <div
                                            key={i}
                                            className="text-xs px-2 py-1 bg-slate-50 rounded border border-slate-100"
                                        >
                                            <span className="text-slate-500">
                                                #{i + 1}
                                            </span>{' '}
                                            <span className="font-medium">
                                                {seg.fontName || '?'}
                                            </span>{' '}
                                            <span className="text-slate-400">
                                                @{seg.fontSize}pt
                                            </span>{' '}
                                            <span className="text-slate-600 truncate">
                                                &ldquo;
                                                {seg.text.slice(0, 30)}
                                                {seg.text.length > 30
                                                    ? '...'
                                                    : ''}
                                                &rdquo;
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700">
                            Text Color
                        </Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={segments[0]?.colorHex || '#000000'}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => onColorChange(e.target.value)}
                                className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                            />
                            <Label className="text-xs text-slate-500">
                                Pick a fill color for the text
                            </Label>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700">
                            Position
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label
                                    htmlFor="tb-pos-x"
                                    className="text-xs text-slate-600"
                                >
                                    X
                                </Label>
                                <Input
                                    id="tb-pos-x"
                                    type="number"
                                    value={bbox.x.toFixed(2)}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => onMove('x', e.target.value)}
                                    className="h-8 text-sm"
                                    step="1"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="tb-pos-y"
                                    className="text-xs text-slate-600"
                                >
                                    Y
                                </Label>
                                <Input
                                    id="tb-pos-y"
                                    type="number"
                                    value={bbox.y.toFixed(2)}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => onMove('y', e.target.value)}
                                    className="h-8 text-sm"
                                    step="1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700">
                            Size (read-only)
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-600">
                                    Width
                                </Label>
                                <Input
                                    value={bbox.width.toFixed(2)}
                                    disabled
                                    className="h-8 text-sm bg-slate-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-600">
                                    Height
                                </Label>
                                <Input
                                    value={bbox.height.toFixed(2)}
                                    disabled
                                    className="h-8 text-sm bg-slate-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="tb-page"
                            className="text-xs font-semibold text-slate-700"
                        >
                            Page Number
                        </Label>
                        <Input
                            id="tb-page"
                            value={textBlock.page}
                            disabled
                            className="h-8 text-sm bg-slate-50"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700">
                            Embed Font
                        </Label>
                        <p className="text-xs text-slate-500">
                            Upload a .ttf, .otf, or .woff font file to embed in
                            the PDF.
                        </p>
                        <input
                            ref={fontInputRef}
                            type="file"
                            accept=".ttf,.otf,.woff"
                            onChange={onFontUpload}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fontInputRef.current?.click()}
                            className="w-full h-10 hover:bg-slate-50"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Font
                        </Button>
                        {embeddedFonts.length > 0 && (
                            <div className="space-y-1 mt-2">
                                <Label className="text-xs text-slate-500">
                                    Uploaded Fonts
                                </Label>
                                {embeddedFonts.map((ef, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-50 rounded border border-slate-100"
                                    >
                                        <span className="font-medium truncate">
                                            {ef.name}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] ml-2"
                                        >
                                            {ef.fontType || 'Font'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onRemove}
                        className="w-full h-10 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Text
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
