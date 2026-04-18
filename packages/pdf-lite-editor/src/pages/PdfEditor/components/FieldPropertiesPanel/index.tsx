import React from 'react'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent } from '@/components/shadcn/card'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import { Separator } from '@/components/shadcn/separator'
import { Copy, Plus, Settings, Trash2, X } from 'lucide-react'
import type { ExtractedField } from '../../types'

type Props = {
    field: ExtractedField
    onNameChange: (value: string) => void
    onValueChange: (value: string) => void
    onFontSizeChange: (value: string) => void
    onQuaddingChange: (value: string) => void
    onAppearanceStateChange: (value: string) => void
    onRectChange: (
        property: 'x' | 'y' | 'width' | 'height',
        value: string,
    ) => void
    onOptionsChange: (options: { label: string; value: string }[]) => void
    onClone: () => void
    onRemove: () => void
    onClose: () => void
}

export function FieldPropertiesPanel({
    field,
    onNameChange,
    onValueChange,
    onFontSizeChange,
    onQuaddingChange,
    onAppearanceStateChange,
    onRectChange,
    onOptionsChange,
    onClone,
    onRemove,
    onClose,
}: Props) {
    return (
        <Card className="sticky top-6 h-[calc(100vh-48px)] rounded-[24px] border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <CardContent className="flex h-full flex-col p-0 bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <h2 className="font-semibold text-sm">
                            Field Properties
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
                            htmlFor="field-name"
                            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Field Name
                        </Label>
                        <Input
                            id="field-name"
                            value={field.name}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => onNameChange(e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="field-type"
                            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Field Type
                        </Label>
                        <Input
                            id="field-type"
                            value={field.type || 'Unknown'}
                            disabled
                            className="h-8 text-sm bg-slate-50 dark:bg-slate-700"
                        />
                    </div>

                    {field.type === 'Button' && field.appearanceStates && field.appearanceStates.length > 0 && (
                        <div className="space-y-2">
                            <Label
                                htmlFor="default-state"
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Default State
                            </Label>
                            <select
                                id="default-state"
                                value={field.appearanceState || 'Off'}
                                onChange={(
                                    e: React.ChangeEvent<HTMLSelectElement>,
                                ) => onAppearanceStateChange(e.target.value)}
                                className="h-8 w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1 bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                                {field.appearanceStates.map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {field.type === 'Choice' && field.options && (
                        <>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="field-value"
                                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Selected Value
                                </Label>
                                <select
                                    id="field-value"
                                    value={field.value}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>,
                                    ) => onValueChange(e.target.value)}
                                    className="h-8 w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1 bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    {field.options.map((opt, i) => (
                                        <option key={i} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Options
                                </Label>
                                <div className="space-y-1">
                                    {field.options.map((opt, i) => (
                                        <div key={i} className="flex gap-1 items-center">
                                            <Input
                                                value={opt.label}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const newOptions = [...field.options!]
                                                    newOptions[i] = { label: e.target.value, value: e.target.value }
                                                    onOptionsChange(newOptions)
                                                }}
                                                className="h-7 text-xs flex-1"
                                                placeholder="Option label"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    const newOptions = field.options!.filter((_, j) => j !== i)
                                                    onOptionsChange(newOptions)
                                                }}
                                                disabled={field.options!.length <= 1}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-7 text-xs"
                                    onClick={() => {
                                        const newOptions = [...field.options!, { label: `Option ${field.options!.length + 1}`, value: `Option ${field.options!.length + 1}` }]
                                        onOptionsChange(newOptions)
                                    }}
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Add Option
                                </Button>
                            </div>
                        </>
                    )}

                    {field.type !== 'Checkbox' && field.type !== 'Button' && field.type !== 'Choice' && (
                        <div className="space-y-2">
                            <Label
                                htmlFor="field-value"
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Default Value
                            </Label>
                            <Input
                                id="field-value"
                                value={field.value}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => onValueChange(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    )}

                    {field.fontSize !== undefined && (
                        <div className="space-y-2">
                            <Label
                                htmlFor="font-size"
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Font Size
                            </Label>
                            <Input
                                id="font-size"
                                type="number"
                                value={field.fontSize || 12}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => onFontSizeChange(e.target.value)}
                                className="h-8 text-sm"
                                min="6"
                                max="72"
                            />
                        </div>
                    )}

                    {field.type === 'Text' && (
                        <div className="space-y-2">
                            <Label
                                htmlFor="alignment"
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Text Alignment
                            </Label>
                            <select
                                id="alignment"
                                value={field.quadding ?? 0}
                                onChange={(
                                    e: React.ChangeEvent<HTMLSelectElement>,
                                ) => onQuaddingChange(e.target.value)}
                                className="h-8 w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1 bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                                <option value="0">Left</option>
                                <option value="1">Center</option>
                                <option value="2">Right</option>
                            </select>
                        </div>
                    )}

                    {field.rect && (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Position & Size
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="pos-x"
                                        className="text-xs text-slate-600 dark:text-slate-400"
                                    >
                                        X
                                    </Label>
                                    <Input
                                        id="pos-x"
                                        type="number"
                                        value={field.rect[0].toFixed(2)}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => onRectChange('x', e.target.value)}
                                        className="h-8 text-sm"
                                        step="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="pos-y"
                                        className="text-xs text-slate-600 dark:text-slate-400"
                                    >
                                        Y
                                    </Label>
                                    <Input
                                        id="pos-y"
                                        type="number"
                                        value={field.rect[1].toFixed(2)}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => onRectChange('y', e.target.value)}
                                        className="h-8 text-sm"
                                        step="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="width"
                                        className="text-xs text-slate-600 dark:text-slate-400"
                                    >
                                        Width
                                    </Label>
                                    <Input
                                        id="width"
                                        type="number"
                                        value={(
                                            field.rect[2] - field.rect[0]
                                        ).toFixed(2)}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) =>
                                            onRectChange('width', e.target.value)
                                        }
                                        className="h-8 text-sm"
                                        step="1"
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="height"
                                        className="text-xs text-slate-600 dark:text-slate-400"
                                    >
                                        Height
                                    </Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        value={(
                                            field.rect[3] - field.rect[1]
                                        ).toFixed(2)}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) =>
                                            onRectChange(
                                                'height',
                                                e.target.value,
                                            )
                                        }
                                        className="h-8 text-sm"
                                        step="1"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label
                            htmlFor="page-num"
                            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Page Number
                        </Label>
                        <Input
                            id="page-num"
                            value={field.page}
                            disabled
                            className="h-8 text-sm bg-slate-50 dark:bg-slate-700"
                        />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClone}
                            className="w-full h-10 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Clone as Widget-Only
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (
                                    confirm(
                                        `Are you sure you want to delete the field "${field.name}"?`,
                                    )
                                ) {
                                    onRemove()
                                }
                            }}
                            className="w-full h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Field
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
