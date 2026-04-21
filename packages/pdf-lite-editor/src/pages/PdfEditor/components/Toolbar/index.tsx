import React from 'react'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent } from '@/components/shadcn/card'
import { Separator } from '@/components/shadcn/separator'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import {
    CheckSquare,
    ChevronDown,
    Download,
    Eye,
    EyeOff,
    FilePlus,
    FilePlus2,
    FolderOpen,
    Lock,
    PenLine,
    Plus,
    Redo2,
    TextCursorInput,
    Type,
    Undo2,
} from 'lucide-react'
import type { EncryptionAlgorithm, FieldType } from '../../types'

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
    exportAlgorithm: EncryptionAlgorithm
    onExportAlgorithmChange: (value: EncryptionAlgorithm) => void
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
    exportAlgorithm,
    onExportAlgorithmChange,
}: Props) {
    const [showPassword, setShowPassword] = React.useState(false)
    const [showOwnerPassword, setShowOwnerPassword] = React.useState(false)
    return (
        <Card className="sticky top-6 flex h-[calc(100vh-48px)] flex-col rounded-[24px] border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-800">
            <CardContent className="flex h-full flex-col gap-2 p-3 overflow-hidden">
                <div className="flex items-center justify-between flex-shrink-0">
                    <h1 className="text-lg font-bold tracking-tight">
                        PDF Editor
                    </h1>
                    <div className="flex gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onUndo}
                            disabled={!canUndo}
                            className="h-7 w-7 rounded-lg"
                            title="Undo"
                        >
                            <Undo2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onRedo}
                            disabled={!canRedo}
                            className="h-7 w-7 rounded-lg"
                            title="Redo"
                        >
                            <Redo2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <Separator className="flex-shrink-0" />

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                    <div>
                        <div className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Add Items
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            <DragButton
                                icon={TextCursorInput}
                                label="Text Field"
                                disabled={!pdfLoaded}
                                onClick={() => onAddField('Text')}
                                onDragStart={() => onFieldDragStart('Text')}
                                onDragEnd={onFieldDragEnd}
                            />
                            <DragButton
                                icon={CheckSquare}
                                label="Checkbox"
                                disabled={!pdfLoaded}
                                onClick={() => onAddField('Checkbox')}
                                onDragStart={() => onFieldDragStart('Checkbox')}
                                onDragEnd={onFieldDragEnd}
                            />
                            <DragButton
                                icon={ChevronDown}
                                label="Select"
                                disabled={!pdfLoaded}
                                onClick={() => onAddField('Choice')}
                                onDragStart={() => onFieldDragStart('Choice')}
                                onDragEnd={onFieldDragEnd}
                            />
                            <DragButton
                                icon={Type}
                                label="Text Block"
                                disabled={!pdfLoaded}
                                onClick={onAddText}
                                onDragStart={onTextDragStart}
                                onDragEnd={onTextDragEnd}
                            />
                            <DragButton
                                icon={PenLine}
                                label="Signature"
                                disabled={!pdfLoaded}
                                onClick={() => onAddField('Signature')}
                                onDragStart={() => onFieldDragStart('Signature')}
                                onDragEnd={onFieldDragEnd}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Document
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            <CompactButton icon={FilePlus} label="New" onClick={onNew} />
                            <CompactButton icon={FolderOpen} label="Open" onClick={onOpen} />
                            <CompactButton icon={FilePlus2} label="Add Page" onClick={onAddPage} disabled={!pdfLoaded} />
                            <CompactButton icon={Download} label="Export" onClick={onExport} disabled={!pdfLoaded} />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="mb-1 flex items-center gap-1.5">
                            <input
                                type="checkbox"
                                id="encrypt-on-export"
                                checked={encryptOnExport}
                                onChange={(e) => onEncryptOnExportChange(e.target.checked)}
                                disabled={!pdfLoaded}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:opacity-50"
                            />
                            <Label htmlFor="encrypt-on-export" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Encrypt on Export
                            </Label>
                        </div>
                        {encryptOnExport && pdfLoaded && (
                            <div className="space-y-1.5 pl-1 mt-1.5">
                                <div className="space-y-0.5">
                                    <Label htmlFor="export-password" className="text-[11px] text-slate-500 dark:text-slate-400">User Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="export-user-pw"
                                            type="text"
                                            autoComplete="off"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            value={exportPassword}
                                            onChange={(e) => onExportPasswordChange(e.target.value)}
                                            placeholder="Required"
                                            className={`h-7 pr-7 text-xs ${!showPassword ? '[&]:[-webkit-text-security:disc] [&]:[text-security:disc]' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <Label htmlFor="export-owner-password" className="text-[11px] text-slate-500 dark:text-slate-400">Owner Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="export-owner-pw"
                                            type="text"
                                            autoComplete="off"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            value={exportOwnerPassword}
                                            onChange={(e) => onExportOwnerPasswordChange(e.target.value)}
                                            placeholder="Optional"
                                            className={`h-7 pr-7 text-xs ${!showOwnerPassword ? '[&]:[-webkit-text-security:disc] [&]:[text-security:disc]' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showOwnerPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <Label htmlFor="export-algorithm" className="text-[11px] text-slate-500 dark:text-slate-400">Algorithm</Label>
                                    <select
                                        id="export-algorithm"
                                        value={exportAlgorithm}
                                        onChange={(e) => onExportAlgorithmChange(e.target.value as EncryptionAlgorithm)}
                                        className="h-7 w-full text-xs rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    >
                                        <option value="AES-256">AES-256 (recommended)</option>
                                        <option value="AES-128">AES-128</option>
                                        <option value="RC4-128">RC4-128 (legacy)</option>
                                        <option value="RC4-40">RC4-40 (legacy)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function DragButton({
    icon: Icon,
    label,
    disabled,
    onClick,
    onDragStart,
    onDragEnd,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    disabled?: boolean
    onClick: () => void
    onDragStart: () => void
    onDragEnd: () => void
}) {
    return (
        <button
            type="button"
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            disabled={disabled}
            className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-slate-700 dark:text-slate-300 cursor-grab active:cursor-grabbing transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 hover:shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:hover:border-slate-200 disabled:hover:shadow-none"
            title={label}
        >
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-medium leading-tight">{label}</span>
        </button>
    )
}

function CompactButton({
    icon: Icon,
    label,
    onClick,
    disabled,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 hover:shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:hover:border-slate-200 disabled:hover:shadow-none cursor-pointer"
        >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    )
}
