import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PdfViewer } from '@/components/PdfViewer'
import {
    MousePointer2,
    Type,
    CheckSquare,
    Wand2,
    Undo2,
    Redo2,
    FolderOpen,
    Download,
    Upload,
    FileUp,
    FileText,
    Eye,
    Layers,
} from 'lucide-react'
import { PdfDocument } from 'pdf-lite'

type FieldType = 'Text' | 'Checkbox' | 'Button' | 'Choice' | 'Signature'

type MockField = {
    id: string
    name: string
    type: FieldType
    page: number
    x: number
    y: number
    w: number
    h: number
}

type ExtractedField = {
    id: string
    name: string
    type: FieldType | null
    page: number
    rect: [number, number, number, number] | null
    value: string
    pageHeight: number
    pageWidth: number
}

type LayerItem = {
    id: string
    name: string
    kind: string
    visible: boolean
}

type ToolButtonProps = {
    label: string
    active: boolean
    icon: React.ComponentType<{ className?: string }>
    onClick: () => void
}

type ActionButtonProps = {
    label: string
    icon: React.ComponentType<{ className?: string }>
    wide?: boolean
}

type FieldBadgeProps = {
    children: React.ReactNode
    soft?: boolean
}

type LayerListButtonProps = {
    onClick: () => void
}

type PdfPageProps = {
    page: number
    activeTool: string
    selectedField: string
    setSelectedField: React.Dispatch<React.SetStateAction<string>>
    showAllLayers: boolean
    setShowAllLayers: React.Dispatch<React.SetStateAction<boolean>>
}

const pages: number[] = [1, 2, 3, 4]

const mockFields: MockField[] = [
    {
        id: 'f1',
        name: 'CustomerName',
        type: 'Text',
        page: 1,
        x: 90,
        y: 190,
        w: 240,
        h: 40,
    },
    {
        id: 'f2',
        name: 'OrderId',
        type: 'Text',
        page: 1,
        x: 90,
        y: 280,
        w: 180,
        h: 40,
    },
    {
        id: 'f3',
        name: 'Approved',
        type: 'Checkbox',
        page: 2,
        x: 470,
        y: 250,
        w: 28,
        h: 28,
    },
]

const mockAllLayers: LayerItem[] = [
    { id: 'l1', name: 'Background PDF', kind: 'Base', visible: true },
    { id: 'l2', name: 'Editable text layer', kind: 'Text', visible: true },
    { id: 'l3', name: 'AcroForm', kind: 'Form', visible: true },
]

function runSelfChecks(): void {
    const fieldIds = new Set<string>()
    for (const field of mockFields) {
        if (fieldIds.has(field.id))
            throw new Error(`Duplicate field id: ${field.id}`)
        fieldIds.add(field.id)
        if (!pages.includes(field.page))
            throw new Error(
                `Field ${field.id} references missing page ${field.page}`,
            )
        if (field.w <= 0 || field.h <= 0)
            throw new Error(`Field ${field.id} must have positive dimensions`)
    }

    const layerIds = new Set<string>()
    for (const layer of mockAllLayers) {
        if (layerIds.has(layer.id))
            throw new Error(`Duplicate layer id: ${layer.id}`)
        layerIds.add(layer.id)
    }

    if (!mockAllLayers.some((layer) => layer.name === 'Editable text layer')) {
        throw new Error('Missing Editable text layer')
    }

    if (!mockAllLayers.some((layer) => layer.name === 'AcroForm')) {
        throw new Error('Missing AcroForm layer')
    }
}

runSelfChecks()

function ToolButton({ label, active, icon: Icon, onClick }: ToolButtonProps) {
    return (
        <Button
            type="button"
            variant={active ? 'default' : 'ghost'}
            onClick={onClick}
            className="h-10 w-full justify-start rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
        >
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </Button>
    )
}

function ActionButton({ label, icon: Icon, wide = false }: ActionButtonProps) {
    return (
        <Button
            type="button"
            variant="outline"
            className={`rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 active:scale-[0.98] ${wide ? 'col-span-2' : ''}`}
        >
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </Button>
    )
}

function FieldBadge({ children, soft = false }: FieldBadgeProps) {
    return (
        <Badge
            variant={soft ? 'secondary' : 'outline'}
            className="rounded-full px-3 py-1 font-normal"
        >
            {children}
        </Badge>
    )
}

function LayerListButton({ onClick }: LayerListButtonProps) {
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClick}
            className="rounded-full px-3 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-slate-100 active:scale-95"
        >
            All
        </Button>
    )
}

// Field overlay component to render AcroForm fields as visual overlays
function FieldOverlay({ field }: { field: ExtractedField }) {
    if (!field.rect) return null
    
    // PDF rect format: [x1, y1, x2, y2] where (x1,y1) is lower-left, (x2,y2) is upper-right
    const [x1, y1, x2, y2] = field.rect
    const fieldWidth = x2 - x1
    const fieldHeight = y2 - y1
    
    // Convert PDF coordinates (bottom-left origin) to CSS coordinates (top-left origin)
    // Use percentage-based positioning so it scales with the rendered page
    const leftPercent = (x1 / field.pageWidth) * 100
    const topPercent = ((field.pageHeight - y2) / field.pageHeight) * 100
    const widthPercent = (fieldWidth / field.pageWidth) * 100
    const heightPercent = (fieldHeight / field.pageHeight) * 100
    
    // Map field types to colors
    const colorMap: Record<string, string> = {
        Text: 'rgba(59, 130, 246, 0.3)', // blue
        Button: 'rgba(147, 51, 234, 0.3)', // purple
        Checkbox: 'rgba(16, 185, 129, 0.3)', // green
        Choice: 'rgba(245, 158, 11, 0.3)', // amber
        Signature: 'rgba(239, 68, 68, 0.3)', // red
    }
    
    const backgroundColor = field.type ? colorMap[field.type] : 'rgba(156, 163, 175, 0.3)'
    
    return (
        <div
            className="field-overlay-container"
            style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                backgroundColor,
                border: '2px solid rgba(59, 130, 246, 0.6)',
                borderRadius: '4px',
                pointerEvents: 'auto',
                zIndex: 10,
            }}
            title={`${field.name} (${field.type || 'Unknown'})`}
        >
            <div
                className="field-overlay-label"
                style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '0',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#1e40af',
                    backgroundColor: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {field.name}
            </div>
        </div>
    )
}

export function PdfEditor() {
    const [activeTool, setActiveTool] = useState<string>('select')
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null)
    const [activeView, setActiveView] = useState<'pdf' | 'text'>('pdf')
    const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([])
    const [showAcroFormLayer, setShowAcroFormLayer] = useState<boolean>(true)

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        if (file && file.type === 'application/pdf') {
            try {
                const document = await PdfDocument.fromBytes([
                    new Uint8Array(await file.arrayBuffer()),
                ])
                await document.decrypt()

                // Extract AcroForm fields
                const acroform = document.acroform
                const fields: ExtractedField[] = []
                
                if (acroform) {
                    const pages = document.pages.toArray()
                    let fieldIndex = 0
                    
                    const extractField = (field: any) => {
                        const fieldPage = field.page
                        const rect = field.rect
                        
                        // Find the page number (1-indexed) and get page dimensions
                        let pageNumber = 1
                        let pageHeight = 792 // Default Letter size height
                        let pageWidth = 612 // Default Letter size width
                        
                        if (fieldPage) {
                            const pageIndex = pages.findIndex((p: any) => p === fieldPage)
                            if (pageIndex !== -1) {
                                pageNumber = pageIndex + 1
                                pageHeight = fieldPage.height
                                pageWidth = fieldPage.width
                            }
                        }
                        
                        // Add this field if it has a rect (actual widget)
                        if (rect) {
                            fields.push({
                                id: `field_${fieldIndex++}`,
                                name: field.name || `Unnamed Field ${fieldIndex}`,
                                type: field.fieldType,
                                page: pageNumber,
                                rect: rect,
                                value: field.value || '',
                                pageHeight: pageHeight,
                                pageWidth: pageWidth,
                            })
                        }
                        
                        // Also extract children (for parent fields like "Company Name")
                        if (field.children && field.children.length > 0) {
                            field.children.forEach((child: any) => extractField(child))
                        }
                    }
                    
                    acroform.fields.forEach((field: any) => extractField(field))
                }
                
                setExtractedFields(fields)
                setUploadedFile(file)
                setPdfDoc(document)
            } catch (error) {
                console.error('Error loading PDF:', error)
                alert(`Error loading PDF: ${error instanceof Error ? error.message : String(error)}`)
            }
        } else if (file) {
            alert('Please upload a PDF file')
        }
    }

    const handleOpenClick = () => {
        fileInputRef.current?.click()
    }

    const handleClearFile = () => {
        setUploadedFile(null)
        setPdfDoc(null)
        setExtractedFields([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleExportPdf = () => {
        if (!pdfDoc || !uploadedFile) return
        
        const bytes = pdfDoc.toBytes()
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = uploadedFile.name.replace('.pdf', '_edited.pdf')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
            <style>{`
                .field-overlay-label {
                    opacity: 0;
                    transition: opacity 0.2s ease-in-out;
                }
                .field-overlay-container:hover .field-overlay-label {
                    opacity: 1;
                }
                .react-pdf__Page__textContent {
                    pointer-events: none !important;
                }
                .react-pdf__Page__annotations {
                    pointer-events: none !important;
                }
            `}</style>
            <div className="mx-auto grid max-w-[1600px] grid-cols-[240px_minmax(0,1fr)] gap-4 items-start">
                <Card className="sticky top-6 flex h-[calc(100vh-48px)] flex-col rounded-[24px] border-slate-200 shadow-sm">
                    <CardContent className="flex h-full flex-col gap-4 p-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                PDF Editor
                            </h1>
                            <div className="mt-1 text-sm text-slate-500">
                                Form + text editing
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <div className="mb-2 text-sm font-semibold text-slate-800">
                                Tools
                            </div>
                            <div className="space-y-1">
                                <ToolButton
                                    label="Select"
                                    icon={MousePointer2}
                                    active={activeTool === 'select'}
                                    onClick={() => setActiveTool('select')}
                                />
                                <ToolButton
                                    label="Text Field"
                                    icon={Type}
                                    active={activeTool === 'text'}
                                    onClick={() => setActiveTool('text')}
                                />
                                <ToolButton
                                    label="Checkbox"
                                    icon={CheckSquare}
                                    active={activeTool === 'checkbox'}
                                    onClick={() => setActiveTool('checkbox')}
                                />
                                <ToolButton
                                    label="Rename"
                                    icon={Wand2}
                                    active={activeTool === 'rename'}
                                    onClick={() => setActiveTool('rename')}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="mt-auto grid grid-cols-2 gap-2">
                            <ActionButton label="Undo" icon={Undo2} />
                            <ActionButton label="Redo" icon={Redo2} />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleOpenClick}
                                className="col-span-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
                            >
                                <FolderOpen className="mr-2 h-4 w-4" />
                                Open PDF
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExportPdf}
                                disabled={!pdfDoc}
                                className="col-span-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex min-w-0 flex-col gap-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    {!uploadedFile ? (
                        <Card className="rounded-[24px] border-slate-200 shadow-sm">
                            <CardContent className="flex min-h-[500px] flex-col items-center justify-center p-8">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="rounded-2xl bg-slate-100 p-6">
                                        <FileUp className="h-12 w-12 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            No PDF loaded
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Upload a PDF file to start editing
                                            form fields and text
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleOpenClick}
                                        className="mt-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload PDF
                                    </Button>
                                </div>
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
                                        onClick={handleClearFile}
                                        className="rounded-full cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-600 active:scale-95"
                                    >
                                        Clear
                                    </Button>
                                </div>
                                <div className="flex gap-2 px-5 pb-3">
                                    <Button
                                        type="button"
                                        variant={activeView === 'pdf' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setActiveView('pdf')}
                                        className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <Eye className="mr-2 h-3 w-3" />
                                        PDF View
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={activeView === 'text' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setActiveView('text')}
                                        className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <FileText className="mr-2 h-3 w-3" />
                                        Text View
                                    </Button>
                                    {extractedFields.length > 0 && (
                                        <Button
                                            type="button"
                                            variant={showAcroFormLayer ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setShowAcroFormLayer(!showAcroFormLayer)}
                                            className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ml-auto"
                                        >
                                            <Layers className="mr-2 h-3 w-3" />
                                            Fields ({extractedFields.length})
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-6">
                                {pdfDoc && activeView === 'pdf' && (
                                    <PdfViewer
                                        file={pdfDoc?.toBytes()}
                                        className="w-full"
                                        pageWrapper={(page, context) => {
                                            // Filter fields for this page
                                            const pageFields = extractedFields.filter(
                                                f => f.page === context.pageNumber
                                            )
                                            
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
                                                                {pageFields.length} field{pageFields.length !== 1 ? 's' : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                                        <div className="relative">
                                                            {page}
                                                            {showAcroFormLayer && pageFields.map(field => (
                                                                <FieldOverlay key={field.id} field={field} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }}
                                    />
                                )}
                                {pdfDoc && activeView === 'text' && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                        <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap break-words">
                                            {pdfDoc.toString()}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
