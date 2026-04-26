import React from 'react'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent } from '@/components/shadcn/card'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import { Separator } from '@/components/shadcn/separator'
import { Trash2, X, Square } from 'lucide-react'
import type { ExtractedGraphicsBlock } from '../../types'

type Props = {
    graphicsBlock: ExtractedGraphicsBlock
    onFillColorChange: (hex: string | null) => void
    onStrokeColorChange: (hex: string | null) => void
    onStrokeWidthChange: (width: number) => void
    onRemove: () => void
    onClose: () => void
}

export function GraphicsPropertiesPanel({
    graphicsBlock,
    onFillColorChange,
    onStrokeColorChange,
    onStrokeWidthChange,
    onRemove,
    onClose,
}: Props) {
    const bbox = graphicsBlock.bbox
    const hasFill = !!graphicsBlock.fillColorHex
    const hasStroke = !!graphicsBlock.strokeColorHex

    return (
        <Card className="sticky top-6 h-[calc(100vh-48px)] rounded-[24px] border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <CardContent className="flex h-full flex-col p-0 bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Square className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <h2 className="font-semibold text-sm">
                            Graphics Properties
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
                    {graphicsBlock.shapeType && (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Shape
                            </Label>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                {graphicsBlock.shapeType}
                            </div>
                        </div>
                    )}

                    <Separator />

                    {graphicsBlock.shapeType !== 'Image' && (
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Fill
                        </Label>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasFill}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                onFillColorChange(graphicsBlock.strokeColorHex || '#000000')
                                            } else {
                                                onFillColorChange(null)
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Enable fill
                                    </span>
                                </label>
                            </div>
                            {hasFill && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                                        Fill Color
                                    </Label>
                                    <div className="flex items-center gap-1.5 h-8">
                                        <input
                                            type="color"
                                            value={graphicsBlock.fillColorHex || '#000000'}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                onFillColorChange(e.target.value)
                                            }
                                            className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0"
                                        />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {graphicsBlock.fillColorHex || '#000000'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {graphicsBlock.shapeType !== 'Image' && (
                    <>
                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Stroke
                        </Label>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasStroke}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                onStrokeColorChange(graphicsBlock.fillColorHex || '#000000')
                                            } else {
                                                onStrokeColorChange(null)
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Enable stroke
                                    </span>
                                </label>
                            </div>
                            {hasStroke && (
                                <>
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                                        Stroke Color
                                    </Label>
                                    <div className="flex items-center gap-1.5 h-8">
                                        <input
                                            type="color"
                                            value={graphicsBlock.strokeColorHex || '#000000'}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                onStrokeColorChange(e.target.value)
                                            }
                                            className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0"
                                        />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {graphicsBlock.strokeColorHex || '#000000'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-600 dark:text-slate-400">
                                        Stroke Width
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0.1}
                                        max={50}
                                        step={0.5}
                                        value={graphicsBlock.strokeWidth ?? 1}
                                        onChange={(e) =>
                                            onStrokeWidthChange(parseFloat(e.target.value) || 1)
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                    </>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Position &amp; Size
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-600 dark:text-slate-400">
                                    X
                                </Label>
                                <Input
                                    type="number"
                                    value={Math.round(bbox.x)}
                                    readOnly
                                    className="h-8 text-sm bg-slate-50 dark:bg-slate-700"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-600 dark:text-slate-400">
                                    Y
                                </Label>
                                <Input
                                    type="number"
                                    value={Math.round(bbox.y)}
                                    readOnly
                                    className="h-8 text-sm bg-slate-50 dark:bg-slate-700"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-600 dark:text-slate-400">
                                    Width
                                </Label>
                                <Input
                                    type="number"
                                    value={Math.round(bbox.width)}
                                    readOnly
                                    className="h-8 text-sm bg-slate-50 dark:bg-slate-700"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-600 dark:text-slate-400">
                                    Height
                                </Label>
                                <Input
                                    type="number"
                                    value={Math.round(bbox.height)}
                                    readOnly
                                    className="h-8 text-sm bg-slate-50 dark:bg-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t dark:border-slate-700 p-4">
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onRemove}
                        className="w-full"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Graphics
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
