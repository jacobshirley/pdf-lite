import { Button } from '@/components/shadcn/button'
import { Card, CardContent } from '@/components/shadcn/card'
import { Separator } from '@/components/shadcn/separator'
import {
    CheckSquare,
    Download,
    FilePlus,
    FilePlus2,
    FolderOpen,
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
}: Props) {
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

                <div className="flex-shrink-0 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                        <ActionButton label="Undo" icon={Undo2} />
                        <ActionButton label="Redo" icon={Redo2} />
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
