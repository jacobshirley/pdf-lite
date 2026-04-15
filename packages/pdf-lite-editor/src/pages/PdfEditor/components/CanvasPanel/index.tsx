import React, { useRef, useState } from 'react'
import { Badge } from '@/components/shadcn/badge'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent } from '@/components/shadcn/card'
import { Eye, FileText, FileUp, Layers, Loader2, Type, Upload, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { PdfViewer } from '@/components/PdfViewer'
import { PdfTextEditor } from '@/components/PdfTextEditor'
import type {
    ExtractedField,
    ExtractedGraphicsBlock,
    ExtractedTextBlock,
    FieldType,
} from '../../types'
import { FieldOverlay } from '../FieldOverlay'
import { TextBlockOverlay } from '../TextBlockOverlay'
import { GraphicsBlockOverlay } from '../GraphicsBlockOverlay'

type Props = {
    uploadedFile: File | null
    pdfLoaded: boolean
    pdfLoading: boolean
    zoomLevel: number
    onZoomChange: (zoom: number) => void
    pdfBytes: Uint8Array | undefined
    pdfDebugText: string
    activeView: 'pdf' | 'text'
    onViewChange: (view: 'pdf' | 'text') => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onOpenClick: () => void
    onClearFile: () => void
    extractedFields: ExtractedField[]
    extractedTextBlocks: ExtractedTextBlock[]
    extractedGraphicsBlocks: ExtractedGraphicsBlock[]
    showAcroFormLayer: boolean
    showTextLayer: boolean
    showGraphicsLayer: boolean
    onToggleAcroFormLayer: () => void
    onToggleTextLayer: () => void
    onToggleGraphicsLayer: () => void
    selectedFieldId: string | null
    selectedTextBlockId: string | null
    editingTextBlockId: string | null
    editText: string
    draggedFieldType: FieldType | null
    draggingText: boolean
    onFieldSelect: (id: string) => void
    onFieldPositionChange: (
        fieldId: string,
        newRect: [number, number, number, number],
    ) => void
    onTextBlockSelect: (id: string) => void
    onTextBlockDoubleClick: (id: string) => void
    onEditTextChange: (text: string) => void
    onTextEditCommit: () => void
    onTextEditCancel: () => void
    onTextBlockPositionChange: (
        blockId: string,
        dx: number,
        dy: number,
    ) => void
    onBackgroundClick: () => void
    onPageDrop: (
        e: React.DragEvent,
        pageNumber: number,
        pageElement: HTMLElement,
    ) => void
}

export function CanvasPanel({
    uploadedFile,
    pdfLoaded,
    pdfLoading,
    zoomLevel,
    onZoomChange,
    pdfBytes,
    pdfDebugText,
    activeView,
    onViewChange,
    fileInputRef,
    onFileUpload,
    onOpenClick,
    onClearFile,
    extractedFields,
    extractedTextBlocks,
    extractedGraphicsBlocks,
    showAcroFormLayer,
    showTextLayer,
    showGraphicsLayer,
    onToggleAcroFormLayer,
    onToggleTextLayer,
    onToggleGraphicsLayer,
    selectedFieldId,
    selectedTextBlockId,
    editingTextBlockId,
    editText,
    draggedFieldType,
    draggingText,
    onFieldSelect,
    onFieldPositionChange,
    onTextBlockSelect,
    onTextBlockDoubleClick,
    onEditTextChange,
    onTextEditCommit,
    onTextEditCancel,
    onTextBlockPositionChange,
    onBackgroundClick,
    onPageDrop,
}: Props) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })

    const handleMouseDown = (e: React.MouseEvent) => {
        // Don't pan if clicking on interactive elements
        const target = e.target as HTMLElement
        if (target.closest('.field-overlay-container') || 
            target.closest('.text-block-overlay') ||
            target.closest('button') ||
            target.closest('input')) {
            return
        }
        
        // Only pan with middle mouse button or shift + left click
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            e.preventDefault()
            setIsPanning(true)
            setPanStart({ x: e.clientX, y: e.clientY })
            if (scrollContainerRef.current) {
                setScrollStart({
                    x: scrollContainerRef.current.scrollLeft,
                    y: scrollContainerRef.current.scrollTop,
                })
            }
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && scrollContainerRef.current) {
            const dx = e.clientX - panStart.x
            const dy = e.clientY - panStart.y
            scrollContainerRef.current.scrollLeft = scrollStart.x - dx
            scrollContainerRef.current.scrollTop = scrollStart.y - dy
        }
    }

    const handleMouseUp = () => {
        setIsPanning(false)
    }

    return (
        <div className="flex min-w-0 flex-col gap-6">
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={onFileUpload}
                className="hidden"
            />

            {!uploadedFile ? (
                <Card className="rounded-[24px] border-slate-200 shadow-sm">
                    <CardContent className="flex min-h-[500px] flex-col items-center justify-center p-8">
                        {pdfLoading ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Loading PDF...
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Please wait while we process your file
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="rounded-2xl bg-slate-100 p-6">
                                    <FileUp className="h-12 w-12 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        No PDF loaded
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Upload a PDF file to start editing form
                                        fields and text
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={onOpenClick}
                                    className="mt-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload PDF
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="rounded-[24px] border-slate-200 shadow-sm">
                    <div className="border-b bg-slate-50">
                        <div className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant="secondary"
                                    className="rounded-full"
                                >
                                    {uploadedFile.name}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                    {(
                                        uploadedFile.size /
                                        1024 /
                                        1024
                                    ).toFixed(2)}{' '}
                                    MB
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onClearFile}
                                className="rounded-full cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-600 active:scale-95"
                            >
                                Clear
                            </Button>
                        </div>
                        <div className="flex gap-2 px-5 pb-3">
                            <Button
                                type="button"
                                variant={
                                    activeView === 'pdf' ? 'default' : 'ghost'
                                }
                                size="sm"
                                onClick={() => onViewChange('pdf')}
                                className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <Eye className="mr-2 h-3 w-3" />
                                PDF View
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    activeView === 'text' ? 'default' : 'ghost'
                                }
                                size="sm"
                                onClick={() => onViewChange('text')}
                                className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <FileText className="mr-2 h-3 w-3" />
                                Text View
                            </Button>
                            
                            {pdfLoaded && activeView === 'pdf' && (
                                <div className="flex items-center gap-1 ml-auto border-l pl-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onZoomChange(Math.max(0.25, zoomLevel - 0.25))}
                                        className="rounded-xl cursor-pointer h-8 w-8 p-0"
                                        title="Zoom out"
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs font-medium min-w-[3.5rem] text-center">
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onZoomChange(Math.min(3, zoomLevel + 0.25))}
                                        className="rounded-xl cursor-pointer h-8 w-8 p-0"
                                        title="Zoom in"
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onZoomChange(1)}
                                        className="rounded-xl cursor-pointer h-8 w-8 p-0"
                                        title="Reset zoom"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            
                            {extractedFields.length > 0 && (
                                <Button
                                    type="button"
                                    variant={
                                        showAcroFormLayer ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    onClick={onToggleAcroFormLayer}
                                    className={`rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                                        showAcroFormLayer
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : ''
                                    }`}
                                >
                                    <Layers className="mr-2 h-3 w-3" />
                                    Fields ({extractedFields.length})
                                </Button>
                            )}
                            {extractedTextBlocks.length > 0 && (
                                <Button
                                    type="button"
                                    variant={
                                        showTextLayer ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    onClick={onToggleTextLayer}
                                    className={`rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                                        showTextLayer
                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                            : ''
                                    }`}
                                >
                                    <Type className="mr-2 h-3 w-3" />
                                    Text ({extractedTextBlocks.length})
                                </Button>
                            )}
                            {extractedGraphicsBlocks.length > 0 && (
                                <Button
                                    type="button"
                                    variant={
                                        showGraphicsLayer ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    onClick={onToggleGraphicsLayer}
                                    className={`rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                                        showGraphicsLayer
                                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                                            : ''
                                    }`}
                                >
                                    <Layers className="mr-2 h-3 w-3" />
                                    Graphics ({extractedGraphicsBlocks.length})
                                </Button>
                            )}
                        </div>
                        {pdfLoaded && (
                            <div className="px-5 pb-2">
                                <p className="text-xs text-slate-500">
                                    💡 Hold <kbd className="px-1 py-0.5 text-xs bg-slate-200 rounded">Shift</kbd> and drag to pan the view
                                </p>
                            </div>
                        )}
                    </div>
                    <CardContent 
                        ref={scrollContainerRef}
                        className={`p-6 max-h-[calc(100vh-200px)] overflow-auto select-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{ userSelect: isPanning ? 'none' : 'auto' }}
                    >
                        {pdfLoading ? (
                            <div className="flex min-h-[500px] flex-col items-center justify-center">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            Loading PDF...
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Please wait while we process your file
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : pdfLoaded && activeView === 'pdf' && pdfBytes ? (
                            <PdfViewer
                                file={pdfBytes}
                                className="min-w-[800px] w-full"
                                pageWrapper={(page, context) => {
                                    const pageFields = extractedFields.filter(
                                        (f) => f.page === context.pageNumber,
                                    )
                                    const pageTextBlocks =
                                        extractedTextBlocks.filter(
                                            (tb) =>
                                                tb.page === context.pageNumber,
                                        )
                                    const pageGraphicsBlocks =
                                        extractedGraphicsBlocks.filter(
                                            (gb) =>
                                                gb.page === context.pageNumber,
                                        )

                                    let pageContainerElement: HTMLDivElement | null =
                                        null

                                    return (
                                        <div
                                            key={context.pageNumber}
                                            className="mb-6"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="text-sm font-semibold text-slate-600">
                                                    Page {context.pageNumber}
                                                </div>
                                                {pageFields.length > 0 && (
                                                    <div className="text-xs text-slate-500">
                                                        {pageFields.length}{' '}
                                                        field
                                                        {pageFields.length !== 1
                                                            ? 's'
                                                            : ''}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                ref={(el) => {
                                                    pageContainerElement = el
                                                }}
                                                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                                                onClick={onBackgroundClick}
                                                onDragOver={(e) => {
                                                    if (
                                                        draggedFieldType ||
                                                        draggingText
                                                    ) {
                                                        e.preventDefault()
                                                        e.currentTarget.style.backgroundColor =
                                                            'rgba(59, 130, 246, 0.05)'
                                                    }
                                                }}
                                                onDragLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor =
                                                        'white'
                                                }}
                                                onDrop={(e) => {
                                                    e.currentTarget.style.backgroundColor =
                                                        'white'
                                                    if (pageContainerElement) {
                                                        onPageDrop(
                                                            e,
                                                            context.pageNumber,
                                                            pageContainerElement,
                                                        )
                                                    }
                                                }}
                                            >
                                                <div className="relative" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', width: 'fit-content' }}>
                                                    {page}
                                                    {showAcroFormLayer &&
                                                        pageFields.map(
                                                            (field) => (
                                                                <FieldOverlay
                                                                    key={
                                                                        field.id
                                                                    }
                                                                    field={
                                                                        field
                                                                    }
                                                                    onPositionChange={
                                                                        onFieldPositionChange
                                                                    }
                                                                    onSelect={
                                                                        onFieldSelect
                                                                    }
                                                                    isSelected={
                                                                        field.id ===
                                                                        selectedFieldId
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    {showTextLayer &&
                                                        pageTextBlocks.map(
                                                            (textBlock) => (
                                                                <TextBlockOverlay
                                                                    key={
                                                                        textBlock.id
                                                                    }
                                                                    textBlock={
                                                                        textBlock
                                                                    }
                                                                    onSelect={
                                                                        onTextBlockSelect
                                                                    }
                                                                    isSelected={
                                                                        textBlock.id ===
                                                                        selectedTextBlockId
                                                                    }
                                                                    isEditing={
                                                                        textBlock.id ===
                                                                        editingTextBlockId
                                                                    }
                                                                    editText={
                                                                        textBlock.id ===
                                                                        editingTextBlockId
                                                                            ? editText
                                                                            : ''
                                                                    }
                                                                    onDoubleClick={
                                                                        onTextBlockDoubleClick
                                                                    }
                                                                    onEditChange={
                                                                        onEditTextChange
                                                                    }
                                                                    onEditCommit={
                                                                        onTextEditCommit
                                                                    }
                                                                    onEditCancel={
                                                                        onTextEditCancel
                                                                    }
                                                                    onPositionChange={
                                                                        onTextBlockPositionChange
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    {showGraphicsLayer &&
                                                        pageGraphicsBlocks.map(
                                                            (graphicsBlock) => (
                                                                <GraphicsBlockOverlay
                                                                    key={
                                                                        graphicsBlock.id
                                                                    }
                                                                    graphicsBlock={
                                                                        graphicsBlock
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }}
                            />
                        ) : pdfLoaded && activeView === 'text' ? (
                            <PdfTextEditor
                                content={pdfDebugText}
                                readOnly={true}
                            />
                        ) : null}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
