import React from 'react'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent } from '@/components/shadcn/card'
import { Separator } from '@/components/shadcn/separator'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import {
    CheckSquare,
    Download,
    Eye,
    EyeOff,
    FilePlus,
    FilePlus2,
    FolderOpen,
    Lock,
    Plus,
    Redo2,
    Type,
    Undo2,
} from 'lucide-react'
import { ActionButton } from '../ActionButton'
import type { FieldType } from '../../types'

type Props = {
    pdfLoaded: boolean
    onAddField: (type: FieldType) => void
    onFieldDragStart: (type: FieldType) => void
    onFieldDragEnd: () => void
    onAddText: () => void
    onTextDragStart: () => void
    onTextDragEnd: () => void
    onNew: () => void
    onOpen: () => void
    onExport: () => void
    onAddPage: () => void
    onUndo: () => void
    onRedo: () => void
    canUndo: boolean
    canRedo: boolean
    encryptOnExport: boolean
    exportPassword: string
    exportOwnerPassword: string
    onEncryptOnExportChange: (value: boolean) => void
    onExportPasswordChange: (value: string) => void
    onExportOwnerPasswordChange: (value: string) => void
}

export function Toolbar({
    pdfLoaded,
    onAddField,
    onFieldDragStart,
    onFieldDragEnd,
    onAddText,
    onTextDragStart,
    onTextDragEnd,
    onNew,
    onOpen,
    onExport,
    onAddPage,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    encryptOnExport,
    exportPassword,
    exportOwnerPassword,
    onEncryptOnExportChange,
    onExportPasswordChange,
    onExportOwnerPasswordChange,
}: Props) {
    const [showPassword, setShowPassword] = React.useState(false)
    const [showOwnerPassword, setShowOwnerPassword] = React.useState(false)
    return (
        <Card className="sticky top-6 flex h-[calc(100vh-48px)] flex-col rounded-[24px] border-slate-200 shadow-sm">
            <CardContent className="flex h-full flex-col gap-3 p-4 overflow-hidden">
                <div className="flex-shrink-0">
                    <h1 className="text-lg font-bold tracking-tight">
                        PDF Editor
                    </h1>
                </div>

                <Separator className="flex-shrink-0" />

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    <div>
                        <div className="mb-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wide">
                            Add Fields
                        </div>
                        <div className="space-y-1">
                            <Button
                                type="button"
                                variant="ghost"
                                draggable
                                onDragStart={() => onFieldDragStart('Text')}
                                onDragEnd={onFieldDragEnd}
                                onClick={() => onAddField('Text')}
                                disabled={!pdfLoaded}
                                className="h-9 w-full justify-start rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                <Type className="mr-2 h-3.5 w-3.5" />
                                <span className="text-sm">Text Field</span>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                draggable
                                onDragStart={() => onFieldDragStart('Checkbox')}
                                onDragEnd={onFieldDragEnd}
                                onClick={() => onAddField('Checkbox')}
                                disabled={!pdfLoaded}
                                className="h-9 w-full justify-start rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                <CheckSquare className="mr-2 h-3.5 w-3.5" />
                                <span className="text-sm">Checkbox</span>
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="mb-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wide">
                            Add Text
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            draggable
                            onDragStart={onTextDragStart}
                            onDragEnd={onTextDragEnd}
                            onClick={onAddText}
                            disabled={!pdfLoaded}
                            className="h-9 w-full justify-start rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
                        >
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            <Type className="mr-2 h-3.5 w-3.5" />
                            <span className="text-sm">New Text</span>
                        </Button>
                    </div>
                </div>

                <Separator className="flex-shrink-0" />

                <div className="flex-shrink-0 space-y-3">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="encrypt-on-export"
                                checked={encryptOnExport}
                                onChange={(e) => onEncryptOnExportChange(e.target.checked)}
                                disabled={!pdfLoaded}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:opacity-50"
                            />
                            <Label htmlFor="encrypt-on-export" className="text-xs font-semibold text-slate-800 uppercase tracking-wide cursor-pointer">
                                <Lock className="inline h-3 w-3 mr-1" />
                                Encrypt on Export
                            </Label>
                        </div>
                        {encryptOnExport && pdfLoaded && (
                            <div className="space-y-2 pl-1">
                                <div className="space-y-1">
                                    <Label htmlFor="export-password" className="text-xs text-slate-600">User Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="export-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={exportPassword}
                                            onChange={(e) => onExportPasswordChange(e.target.value)}
                                            placeholder="Required"
                                            className="h-8 pr-8 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="export-owner-password" className="text-xs text-slate-600">Owner Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="export-owner-password"
                                            type={showOwnerPassword ? 'text' : 'password'}
                                            value={exportOwnerPassword}
                                            onChange={(e) => onExportOwnerPasswordChange(e.target.value)}
                                            placeholder="Optional"
                                            className="h-8 pr-8 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showOwnerPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Separator className="flex-shrink-0" />

                <div className="flex-shrink-0 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                        <ActionButton label="Undo" icon={Undo2} onClick={onUndo} disabled={!canUndo} />
                        <ActionButton label="Redo" icon={Redo2} onClick={onRedo} disabled={!canRedo} />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onNew}
                        className="col-span-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
                    >
                        <FilePlus className="mr-2 h-4 w-4" />
                        New PDF
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onOpen}
                        className="col-span-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
                    >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Open PDF
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onAddPage}
                        disabled={!pdfLoaded}
                        className="col-span-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Add Page
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onExport}
                        disabled={!pdfLoaded}
                        className="col-span-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
