import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PdfViewer } from '@/components/PdfViewer'
import { PdfTextEditor } from '@/components/PdfTextEditor'
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
    X,
    Settings,
    Trash2,
    Plus,
    Copy,
} from 'lucide-react'
import {
    PdfDocument,
    PdfFormField,
    PdfTextFormField,
    PdfButtonFormField,
    PdfIndirectObject,
    PdfStream,
    Text,
    type GraphicLine,
    parseContentStreamForGraphics,
} from 'pdf-lite'

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
    fieldRef?: PdfFormField // Reference to the actual PdfFormField object
}

type LayerItem = {
    id: string
    name: string
    kind: string
    visible: boolean
}

type ExtractedTextBlock = {
    block: Text
    id: string
    page: number
    pageHeight: number
    pageWidth: number
}

type ExtractedGraphicLine = GraphicLine & {
    id: string
    page: number
    pageHeight: number
    pageWidth: number
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
function FieldOverlay({
    field,
    onPositionChange,
    onSelect,
    isSelected,
}: {
    field: ExtractedField
    onPositionChange: (
        fieldId: string,
        newRect: [number, number, number, number],
    ) => void
    onSelect: (fieldId: string) => void
    isSelected: boolean
}) {
    if (!field.rect) return null

    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState<string | null>(null) // 'se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's'
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [tempPosition, setTempPosition] = useState<{
        left: number
        top: number
    } | null>(null)
    const [tempSize, setTempSize] = useState<{
        width: number
        height: number
    } | null>(null)

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

    // Use temp position/size if dragging/resizing, otherwise use calculated position
    const displayLeft = tempPosition
        ? `${tempPosition.left}%`
        : `${leftPercent}%`
    const displayTop = tempPosition ? `${tempPosition.top}%` : `${topPercent}%`
    const displayWidth = tempSize ? `${tempSize.width}%` : `${widthPercent}%`
    const displayHeight = tempSize ? `${tempSize.height}%` : `${heightPercent}%`

    // Check if this is a widget-only field (has a parent)
    const isWidgetOnly =
        field.fieldRef?.parent !== undefined && field.fieldRef?.parent !== null

    // Map field types to colors
    const colorMap: Record<string, string> = {
        Text: 'rgba(59, 130, 246, 0.3)', // blue
        Button: 'rgba(147, 51, 234, 0.3)', // purple
        Checkbox: 'rgba(16, 185, 129, 0.3)', // green
        Choice: 'rgba(245, 158, 11, 0.3)', // amber
        Signature: 'rgba(239, 68, 68, 0.3)', // red
    }

    // Widget-only fields get green background, otherwise use type-based color
    const backgroundColor = isWidgetOnly
        ? 'rgba(34, 197, 94, 0.35)' // green for widget-only
        : field.type
          ? colorMap[field.type]
          : 'rgba(156, 163, 175, 0.3)'

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Don't select here - let mouseup handle it to avoid interrupting drag

        const target = e.currentTarget as HTMLElement
        const parent = target.offsetParent as HTMLElement
        if (!parent) return

        const rect = target.getBoundingClientRect()

        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
        setIsDragging(true)
    }

    const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
        e.preventDefault()
        e.stopPropagation()

        onSelect(field.id)
        setIsResizing(handle)
    }

    const handleMouseMove = (e: MouseEvent) => {
        const target = document.querySelector(
            `[data-field-id="${field.id}"]`,
        ) as HTMLElement
        if (!target) return

        const parent = target.offsetParent as HTMLElement
        if (!parent) return

        const parentRect = parent.getBoundingClientRect()

        if (isDragging) {
            // Calculate new position in pixels relative to parent
            const newLeft = e.clientX - parentRect.left - dragOffset.x
            const newTop = e.clientY - parentRect.top - dragOffset.y

            // Convert to percentage
            const newLeftPercent = (newLeft / parentRect.width) * 100
            const newTopPercent = (newTop / parentRect.height) * 100

            setTempPosition({ left: newLeftPercent, top: newTopPercent })
        } else if (isResizing) {
            // Get current rect in pixels
            const currentRect = target.getBoundingClientRect()
            const currentLeft = currentRect.left - parentRect.left
            const currentTop = currentRect.top - parentRect.top
            const currentWidth = currentRect.width
            const currentHeight = currentRect.height

            let newLeft = currentLeft
            let newTop = currentTop
            let newWidth = currentWidth
            let newHeight = currentHeight

            const mouseX = e.clientX - parentRect.left
            const mouseY = e.clientY - parentRect.top

            // Handle different resize directions
            if (isResizing.includes('e')) {
                newWidth = mouseX - currentLeft
            }
            if (isResizing.includes('w')) {
                newWidth = currentWidth + (currentLeft - mouseX)
                newLeft = mouseX
            }
            if (isResizing.includes('s')) {
                newHeight = mouseY - currentTop
            }
            if (isResizing.includes('n')) {
                newHeight = currentHeight + (currentTop - mouseY)
                newTop = mouseY
            }

            // Enforce minimum size
            const minWidth = 20
            const minHeight = 10
            if (newWidth < minWidth) newWidth = minWidth
            if (newHeight < minHeight) newHeight = minHeight

            // Convert to percentage
            const newLeftPercent = (newLeft / parentRect.width) * 100
            const newTopPercent = (newTop / parentRect.height) * 100
            const newWidthPercent = (newWidth / parentRect.width) * 100
            const newHeightPercent = (newHeight / parentRect.height) * 100

            setTempPosition({ left: newLeftPercent, top: newTopPercent })
            setTempSize({ width: newWidthPercent, height: newHeightPercent })
        }
    }

    const handleMouseUp = () => {
        if (isDragging && tempPosition) {
            // Moving: keep same size
            const newLeftPercent = tempPosition.left
            const newTopPercent = tempPosition.top

            // Convert from CSS coords (top-left origin, %) to PDF coords (bottom-left origin, points)
            const newX1 = (newLeftPercent / 100) * field.pageWidth
            const newY2 =
                field.pageHeight - (newTopPercent / 100) * field.pageHeight
            const newX2 = newX1 + fieldWidth
            const newY1 = newY2 - fieldHeight

            const newRect: [number, number, number, number] = [
                newX1,
                newY1,
                newX2,
                newY2,
            ]
            onPositionChange(field.id, newRect)

            setIsDragging(false)
            setTempPosition(null)

            // Select after dragging completes
            onSelect(field.id)
        } else if (isResizing && tempPosition && tempSize) {
            // Resizing: update both position and size
            const newLeftPercent = tempPosition.left
            const newTopPercent = tempPosition.top
            const newWidthPercent = tempSize.width
            const newHeightPercent = tempSize.height

            // Convert from CSS coords (top-left origin, %) to PDF coords (bottom-left origin, points)
            const newX1 = (newLeftPercent / 100) * field.pageWidth
            const newY2 =
                field.pageHeight - (newTopPercent / 100) * field.pageHeight
            const newWidth = (newWidthPercent / 100) * field.pageWidth
            const newHeight = (newHeightPercent / 100) * field.pageHeight
            const newX2 = newX1 + newWidth
            const newY1 = newY2 - newHeight

            const newRect: [number, number, number, number] = [
                newX1,
                newY1,
                newX2,
                newY2,
            ]
            onPositionChange(field.id, newRect)

            setIsResizing(null)
            setTempPosition(null)
            setTempSize(null)
        } else if (isDragging) {
            // Was a click (no drag movement) - select the field
            setIsDragging(false)
            onSelect(field.id)
        } else {
            setIsDragging(false)
            setIsResizing(null)
        }
    }

    React.useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)

            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, isResizing, dragOffset, tempPosition, tempSize])

    const resizeHandleStyle: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: 'rgba(59, 130, 246, 1)',
        border: '1px solid white',
    }

    return (
        <div
            className="field-overlay-container"
            data-field-id={field.id}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                // Stop click from bubbling to page container (which would deselect)
                e.stopPropagation()
            }}
            style={{
                position: 'absolute',
                left: displayLeft,
                top: displayTop,
                width: displayWidth,
                height: displayHeight,
                backgroundColor,
                border: isSelected
                    ? '3px solid rgba(59, 130, 246, 1)'
                    : '2px solid rgba(59, 130, 246, 0.6)',
                borderRadius: '4px',
                pointerEvents: 'auto',
                zIndex: isDragging || isResizing ? 20 : isSelected ? 15 : 10,
                cursor: isDragging
                    ? 'grabbing'
                    : isResizing
                      ? `${isResizing}-resize`
                      : 'grab',
                boxShadow: isSelected
                    ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
                    : 'none',
            }}
            title={`${field.name}${isWidgetOnly ? ' (widget)' : ''}`}
        >
            {/* Resize handles - only show when selected */}
            {isSelected && (
                <>
                    {/* Corner handles */}
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                        style={{
                            ...resizeHandleStyle,
                            top: '-4px',
                            left: '-4px',
                            width: '8px',
                            height: '8px',
                            cursor: 'nw-resize',
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                        style={{
                            ...resizeHandleStyle,
                            top: '-4px',
                            right: '-4px',
                            width: '8px',
                            height: '8px',
                            cursor: 'ne-resize',
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                        style={{
                            ...resizeHandleStyle,
                            bottom: '-4px',
                            left: '-4px',
                            width: '8px',
                            height: '8px',
                            cursor: 'sw-resize',
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                        style={{
                            ...resizeHandleStyle,
                            bottom: '-4px',
                            right: '-4px',
                            width: '8px',
                            height: '8px',
                            cursor: 'se-resize',
                        }}
                    />
                    {/* Edge handles */}
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                        style={{
                            ...resizeHandleStyle,
                            top: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '20px',
                            height: '8px',
                            cursor: 'n-resize',
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                        style={{
                            ...resizeHandleStyle,
                            bottom: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '20px',
                            height: '8px',
                            cursor: 's-resize',
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                        style={{
                            ...resizeHandleStyle,
                            left: '-4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '8px',
                            height: '20px',
                            cursor: 'w-resize',
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                        style={{
                            ...resizeHandleStyle,
                            right: '-4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '8px',
                            height: '20px',
                            cursor: 'e-resize',
                        }}
                    />
                </>
            )}

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
                    pointerEvents: 'none',
                }}
            >
                {field.name}
            </div>
        </div>
    )
}

// Text block overlay component to render text appearance streams as visual overlays
function TextBlockOverlay({
    textBlock,
    onSelect,
    isSelected,
}: {
    textBlock: ExtractedTextBlock
    onSelect: (blockId: string) => void
    isSelected: boolean
}) {
    const { block, page, pageHeight, pageWidth } = textBlock
    const bbox = block.getWorldBoundingBox()

    // PDF coordinates are bottom-left origin, convert to top-left for CSS
    const leftPercent = (bbox.x / pageWidth) * 100
    const topPercent = ((pageHeight - (bbox.y + bbox.height)) / pageHeight) * 100
    const widthPercent = (bbox.width / pageWidth) * 100
    const heightPercent = (bbox.height / pageHeight) * 100

    return (
        <div
            className="text-block-overlay"
            onClick={(e) => {
                e.stopPropagation()
                onSelect(textBlock.id)
            }}
            onDoubleClick={(e) => {
                e.stopPropagation()
                // TODO: Enable text editing mode
                console.log('Edit text block:', textBlock)
            }}
            style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                border: isSelected
                    ? '2px solid rgba(234, 88, 12, 1)'
                    : '1px solid rgba(234, 88, 12, 0.4)',
                backgroundColor: isSelected
                    ? 'rgba(234, 88, 12, 0.15)'
                    : 'rgba(234, 88, 12, 0.08)',
                borderRadius: '2px',
                pointerEvents: 'auto',
                zIndex: isSelected ? 15 : 10,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
            }}
            title={`Text: "${block.text}"`}
        />
    )
}

function GraphicLineOverlay({
    graphicLine,
}: {
    graphicLine: ExtractedGraphicLine
}) {
    const { bbox, pageHeight, pageWidth } = graphicLine

    const leftPercent = (bbox.x / pageWidth) * 100
    const topPercent = ((pageHeight - (bbox.y + bbox.height)) / pageHeight) * 100
    const widthPercent = (bbox.width / pageWidth) * 100
    const heightPercent = (bbox.height / pageHeight) * 100

    return (
        <div
            className="graphic-line-overlay"
            style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${Math.max(heightPercent, 0.3)}%`,
                border: '1px solid rgba(220, 38, 38, 0.4)',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                borderRadius: '1px',
                pointerEvents: 'none',
                zIndex: 5,
            }}
            title="Graphic line"
        />
    )
}

export function PdfEditor() {
    const [activeTool, setActiveTool] = useState<string>('select')
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null)
    const [activeView, setActiveView] = useState<'pdf' | 'text'>('pdf')
    const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([])
    const [extractedTextBlocks, setExtractedTextBlocks] = useState<
        ExtractedTextBlock[]
    >([])
    const [extractedGraphicLines, setExtractedGraphicLines] = useState<
        ExtractedGraphicLine[]
    >([])
    const [showAcroFormLayer, setShowAcroFormLayer] = useState<boolean>(true)
    const [showTextLayer, setShowTextLayer] = useState<boolean>(true)
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
    const [selectedTextBlockId, setSelectedTextBlockId] = useState<
        string | null
    >(null)
    const [pdfVersion, setPdfVersion] = useState<number>(0) // Track PDF modifications
    const [draggedFieldType, setDraggedFieldType] = useState<FieldType | null>(
        null,
    )

    // Memoize PDF bytes to prevent unnecessary PdfViewer re-renders
    const pdfBytes = React.useMemo(() => {
        return pdfDoc?.toBytes()
    }, [pdfDoc, pdfVersion])

    const selectedField =
        extractedFields.find((f) => f.id === selectedFieldId) || null

    const handleFieldSelect = (fieldId: string) => {
        setSelectedFieldId(fieldId)
    }

    const handleFieldPropertyChange = (property: string, value: any) => {
        if (!selectedFieldId) return

        setExtractedFields((prevFields) => {
            const selectedField = prevFields.find(
                (f) => f.id === selectedFieldId,
            )
            if (!selectedField?.fieldRef) return prevFields

            // For widget-only fields, the fieldRef is the widget and we need to update parent for value/name
            const isWidgetOnly = !!selectedField.fieldRef.parent
            const targetForValue = isWidgetOnly
                ? selectedField.fieldRef.parent
                : selectedField.fieldRef
            const targetForWidget = selectedField.fieldRef

            // Update the underlying PdfFormField
            if (property === 'name' && targetForValue) {
                targetForValue.name = value
            } else if (property === 'value' && targetForValue) {
                targetForValue.value = value
                // Setting value triggers updateAppearance internally, which regenerates all children
            } else if (property === 'fontSize') {
                // Update font size in default appearance
                if (targetForWidget.fontSize !== undefined) {
                    targetForWidget.fontSize = parseFloat(value) || 12
                }
            }

            // Update state for all fields that share the same parent (for widget-only fields)
            return prevFields.map((field) => {
                if (field.id === selectedFieldId) {
                    return { ...field, [property]: value }
                }

                // If this is a sibling widget (shares same parent), update its display too
                if (isWidgetOnly && field.fieldRef?.parent === targetForValue) {
                    return { ...field, [property]: value }
                }

                return field
            })
        })

        // Force PDF re-render to show updated values
        setPdfVersion((v) => v + 1)
    }

    const handleRectChange = (
        property: 'x' | 'y' | 'width' | 'height',
        value: string,
    ) => {
        if (!selectedFieldId) return

        const selectedField = extractedFields.find(
            (f) => f.id === selectedFieldId,
        )
        if (!selectedField?.rect) return

        const numValue = parseFloat(value)
        if (isNaN(numValue)) return

        const [x1, y1, x2, y2] = selectedField.rect
        let newRect: [number, number, number, number]

        switch (property) {
            case 'x':
                // Move left edge, keep width
                const width = x2 - x1
                newRect = [numValue, y1, numValue + width, y2]
                break
            case 'y':
                // Move bottom edge, keep height
                const height = y2 - y1
                newRect = [x1, numValue, x2, numValue + height]
                break
            case 'width':
                // Change width, keep x
                newRect = [x1, y1, x1 + numValue, y2]
                break
            case 'height':
                // Change height, keep y
                newRect = [x1, y1, x2, y1 + numValue]
                break
        }

        handleFieldPositionChange(selectedFieldId, newRect)
    }

    const handleFieldPositionChange = (
        fieldId: string,
        newRect: [number, number, number, number],
    ) => {
        // Update the extractedFields state
        setExtractedFields((prevFields) =>
            prevFields.map((field) => {
                if (field.id === fieldId) {
                    // Update the underlying PdfFormField's rect
                    if (field.fieldRef) {
                        field.fieldRef.rect = newRect
                    }
                    return { ...field, rect: newRect }
                }
                return field
            }),
        )
        // Trigger PDF re-render to show updated field
        setPdfVersion((v) => v + 1)
    }

    const handleRemoveField = (fieldId: string) => {
        const fieldToRemove = extractedFields.find((f) => f.id === fieldId)
        if (!fieldToRemove || !pdfDoc?.acroform || !fieldToRemove.fieldRef)
            return

        const isWidgetOnly = !!fieldToRemove.fieldRef.parent

        if (isWidgetOnly) {
            const parent = fieldToRemove.fieldRef.parent!
            const siblings = parent.children.filter(
                (child) => child !== fieldToRemove.fieldRef,
            )

            if (siblings.length > 0) {
                // There are other widgets sharing this parent, just remove this one widget
                // Remove from parent's children array
                parent.children = siblings

                // Delete just the widget object
                pdfDoc.deleteObject(fieldToRemove.fieldRef)
            } else {
                // This is the last widget, delete the parent (which cascades to delete this widget)
                pdfDoc.deleteObject(parent)
            }
        } else {
            // Combined field, delete the field itself
            pdfDoc.deleteObject(fieldToRemove.fieldRef)
        }

        // Remove from state
        setExtractedFields((prevFields) =>
            prevFields.filter((f) => f.id !== fieldId),
        )

        // Clear selection if this field was selected
        if (selectedFieldId === fieldId) {
            setSelectedFieldId(null)
        }

        // Force PDF viewer to reload by incrementing version
        setPdfVersion((v) => v + 1)
    }

    const handleAddField = (
        type: FieldType,
        options?: {
            pageNumber?: number
            x?: number
            y?: number
            width?: number
            height?: number
        },
    ) => {
        if (!pdfDoc?.acroform) return

        // Get the target page
        const targetPageNumber = options?.pageNumber || 1
        const pages = pdfDoc.pages.toArray()
        if (pages.length === 0) {
            alert('No pages in PDF')
            return
        }

        const page = pages[targetPageNumber - 1] || pages[0]
        const pageHeight = page.height
        const pageWidth = page.width

        // Use provided coordinates or default position
        // Checkboxes are smaller by default
        const defaultX = options?.x !== undefined ? options.x : 100
        const defaultY = options?.y !== undefined ? options.y : pageHeight - 200
        const defaultWidth = options?.width || (type === 'Checkbox' ? 20 : 200)
        const defaultHeight = options?.height || (type === 'Checkbox' ? 20 : 30)

        const newRect: [number, number, number, number] = [
            defaultX,
            defaultY - defaultHeight,
            defaultX + defaultWidth,
            defaultY,
        ]

        // Create a unique field name
        const timestamp = Date.now()
        const fieldName = `${type}Field_${timestamp}`

        // Create new PdfFormField based on type
        let newField: PdfFormField | null = null

        if (type === 'Text') {
            // Combined pattern: single field with both widget and value properties
            const combinedField = new PdfTextFormField()
            combinedField.name = fieldName
            combinedField.value = ''
            combinedField.rect = newRect
            combinedField.parentRef = page.reference // Set page reference (page is read-only getter)
            combinedField.defaultAppearance = '/Helv 12 Tf 0 g' // Set default appearance

            // Set form reference
            if (pdfDoc.acroform) {
                combinedField._form = pdfDoc.acroform
            }

            combinedField.updateAppearance()

            newField = combinedField
        } else if (type === 'Checkbox') {
            // Create checkbox button field
            const checkboxField = new PdfButtonFormField()

            checkboxField.rect = newRect
            checkboxField.name = fieldName
            checkboxField.parentRef = page.reference

            // Set form reference BEFORE setting other properties
            if (pdfDoc.acroform) {
                checkboxField._form = pdfDoc.acroform
            }

            // Mark as widget to ensure it's treated as an annotation
            checkboxField.isWidget = true

            // Set initial state to unchecked
            checkboxField.appearanceState = 'Off'

            // Ensure print flag is set so it appears in PDF viewers
            checkboxField.print = true

            // Set border style for visibility
            checkboxField.borderWidth = 1

            newField = checkboxField
        }

        if (!newField) {
            alert(`Creating ${type} fields is not yet fully implemented`)
            return
        }

        // Add to AcroForm
        pdfDoc.acroform.addField(newField)

        // Add to our state
        const newExtractedField: ExtractedField = {
            id: `field_${extractedFields.length}`,
            name: fieldName,
            type: type,
            page: targetPageNumber,
            rect: newRect,
            value: '',
            pageHeight: pageHeight,
            pageWidth: pageWidth,
            fieldRef: newField,
        }

        setExtractedFields((prevFields) => [...prevFields, newExtractedField])
        setSelectedFieldId(newExtractedField.id)

        // Force PDF re-render to show the new field
        setPdfVersion((v) => v + 1)
    }

    const handleCloneField = (fieldId: string) => {
        const fieldToClone = extractedFields.find((f) => f.id === fieldId)
        if (!fieldToClone) {
            return
        }

        if (!pdfDoc?.acroform) {
            return
        }

        if (!fieldToClone.fieldRef) {
            return
        }

        if (!fieldToClone.rect) {
            return
        }

        const page = pdfDoc.pages.toArray()[fieldToClone.page - 1]
        if (!page) {
            return
        }

        try {
            let parentField: PdfFormField
            let isFirstClone = false

            // Check if the original field is already widget-only (has a parent)
            if (fieldToClone.fieldRef.parent) {
                // Use the existing parent
                parentField = fieldToClone.fieldRef.parent
            } else {
                // First clone: Convert the original combined field to widget-only
                // by creating a parent and making the original a child widget
                isFirstClone = true

                parentField = new PdfTextFormField()
                parentField.name = fieldToClone.name // Keep the original name on parent
                parentField.value = fieldToClone.value // Move value to parent
                parentField.defaultAppearance =
                    fieldToClone.fieldRef.defaultAppearance || '/Helv 12 Tf 0 g'

                // Set form reference on parent
                if (pdfDoc.acroform) {
                    ;(parentField as any)._form = pdfDoc.acroform
                }

                // Convert the original field to a widget child
                const originalAsWidget = fieldToClone.fieldRef
                // Remove name and value from widget (now on parent)
                originalAsWidget.content.delete('T') // Name
                originalAsWidget.content.delete('V') // Value

                // Set the parent relationship
                originalAsWidget.parent = parentField

                // Remove the original from acroform fields and add the parent instead
                let acroformFields = pdfDoc.acroform.fields
                const originalIndex = acroformFields.findIndex(
                    (f) => f === originalAsWidget,
                )
                if (originalIndex !== -1) {
                    pdfDoc.acroform.fields = pdfDoc.acroform.fields.filter(
                        (_, i) => i !== originalIndex,
                    )
                }
                pdfDoc.acroform.addField(parentField)
            }

            // Create new widget child with slightly offset position for visibility
            const widget = new PdfTextFormField()
            const offsetX = 20
            const offsetY = 20
            const [x1, y1, x2, y2] = fieldToClone.rect
            const clonedRect: [number, number, number, number] = [
                x1 + offsetX,
                y1 - offsetY,
                x2 + offsetX,
                y2 - offsetY,
            ]
            widget.rect = clonedRect
            widget.parentRef = page.reference // Set page reference (page is read-only getter)
            widget.parent = parentField // This auto-adds widget to parent's children

            // Set form reference on widget
            if (pdfDoc.acroform) {
                ;(widget as any)._form = pdfDoc.acroform
            }

            // Generate appearance for the widget to display the parent's value
            if (widget.generateAppearance) {
                widget.generateAppearance()
            }

            // Add to our state
            const newExtractedField: ExtractedField = {
                id: `field_${extractedFields.length}`,
                name: parentField.name || fieldToClone.name,
                type: fieldToClone.type,
                page: fieldToClone.page,
                rect: clonedRect,
                value: parentField.value || fieldToClone.value,
                pageHeight: fieldToClone.pageHeight,
                pageWidth: fieldToClone.pageWidth,
                fieldRef: widget, // Store the widget for display
            }

            setExtractedFields((prevFields) => {
                // If first clone, also update the original field to reflect it's now a widget
                if (isFirstClone) {
                    return [
                        ...prevFields.map((f) =>
                            f.id === fieldId
                                ? {
                                      ...f,
                                      name: parentField.name,
                                      value: parentField.value,
                                  }
                                : f,
                        ),
                        newExtractedField,
                    ]
                }
                return [...prevFields, newExtractedField]
            })
            setSelectedFieldId(newExtractedField.id)
            setPdfVersion((v) => v + 1)
        } catch (error) {
            console.error('Error during clone:', error)
            alert(
                `Error cloning field: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        if (file && file.type === 'application/pdf') {
            try {
                const document = await PdfDocument.fromBytes([
                    new Uint8Array(await file.arrayBuffer()),
                ])
                // await document.decrypt()

                for (const object of document.objects) {
                    if (
                        object instanceof PdfIndirectObject &&
                        object.content instanceof PdfStream
                    ) {
                        object.content.removeAllFilters()
                    }
                }

                // Extract AcroForm fields
                const acroform = document.acroform
                const fields: ExtractedField[] = []

                if (acroform) {
                    const pages = document.pages.toArray()
                    let fieldIndex = 0

                    const extractField = (field: PdfFormField) => {
                        const fieldPage = field.page
                        const rect = field.rect

                        // Find the page number (1-indexed) and get page dimensions
                        let pageNumber = 1
                        let pageHeight = 792 // Default Letter size height
                        let pageWidth = 612 // Default Letter size width

                        if (fieldPage) {
                            const pageIndex = pages.findIndex(
                                (p: any) => p === fieldPage,
                            )
                            if (pageIndex !== -1) {
                                pageNumber = pageIndex + 1
                                pageHeight = fieldPage.height
                                pageWidth = fieldPage.width
                            }
                        }

                        // Add this field if it has a rect (actual widget)
                        if (rect) {
                            // For widget-only fields, get the name and value from the parent
                            const isWidgetOnly = !field.name && field.parent
                            const nameSource = isWidgetOnly
                                ? field.parent
                                : field
                            const valueSource = isWidgetOnly
                                ? field.parent
                                : field

                            fields.push({
                                id: `field_${fieldIndex++}`,
                                name:
                                    nameSource?.name ||
                                    `Unnamed Field ${fieldIndex}`,
                                type: field.fieldType,
                                page: pageNumber,
                                rect: rect,
                                value: valueSource?.value || '',
                                pageHeight: pageHeight,
                                pageWidth: pageWidth,
                                fieldRef: field, // Store reference to the actual field (widget or combined)
                            })
                        }

                        // Also extract children (for parent fields like "Company Name")
                        if (field.children && field.children.length > 0) {
                            field.children.forEach((child: any) =>
                                extractField(child),
                            )
                        }
                    }

                    acroform.fields.forEach((field: any) => extractField(field))
                }

                setExtractedFields(fields)

                // Extract text blocks from page content streams
                const textBlocks: ExtractedTextBlock[] = []
                const pages = document.pages.toArray()
                let textBlockIndex = 0

                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i]
                    const pageNumber = i + 1

                    try {
                        const blocks = page.extractTextBlocks()
                        for (const block of blocks) {
                            if (block.text.trim().length === 0) continue
                            textBlocks.push({
                                block,
                                id: `text_block_${textBlockIndex++}`,
                                page: pageNumber,
                                pageHeight: page.height,
                                pageWidth: page.width,
                            })
                        }
                    } catch (error) {
                        console.warn(
                            `Failed to extract text blocks from page ${pageNumber}:`,
                            error,
                        )
                    }
                }

                setExtractedTextBlocks(textBlocks)

                // Extract graphic lines from page content streams
                const graphicLines: ExtractedGraphicLine[] = []
                let graphicLineIndex = 0

                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i]
                    const pageNumber = i + 1

                    try {
                        for (const stream of page.contentStreams) {
                            const lines = parseContentStreamForGraphics(
                                stream.dataAsString,
                            )
                            for (const line of lines) {
                                graphicLines.push({
                                    ...line,
                                    id: `graphic_line_${graphicLineIndex++}`,
                                    page: pageNumber,
                                    pageHeight: page.height,
                                    pageWidth: page.width,
                                })
                            }
                        }
                    } catch (error) {
                        console.warn(
                            `Failed to extract graphic lines from page ${pageNumber}:`,
                            error,
                        )
                    }
                }

                setExtractedGraphicLines(graphicLines)

                setUploadedFile(file)
                setPdfDoc(document)
            } catch (error) {
                console.error('Error loading PDF:', error)
                alert(
                    `Error loading PDF: ${error instanceof Error ? error.message : String(error)}`,
                )
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
        setExtractedTextBlocks([])
        setSelectedFieldId(null)
        setSelectedTextBlockId(null)
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

    const handleFieldDragStart = (type: FieldType) => {
        setDraggedFieldType(type)
    }

    const handleFieldDragEnd = () => {
        setDraggedFieldType(null)
    }

    const handlePageDrop = (
        e: React.DragEvent,
        pageNumber: number,
        pageElement: HTMLElement,
    ) => {
        e.preventDefault()
        if (!draggedFieldType || !pdfDoc) return

        // Get the page dimensions from the first page (or target page)
        const pages = pdfDoc.pages.toArray()
        const page = pages[pageNumber - 1]
        if (!page) return

        const pageHeight = page.height
        const pageWidth = page.width

        // Get drop position relative to the page element
        const pageRect = pageElement.getBoundingClientRect()
        const dropX = e.clientX - pageRect.left
        const dropY = e.clientY - pageRect.top

        // Convert from CSS pixels to PDF coordinates
        // The page element is scaled, so we need to account for that
        const scaleX = pageWidth / pageRect.width
        const scaleY = pageHeight / pageRect.height

        // PDF coordinates: bottom-left origin
        // CSS coordinates: top-left origin
        const pdfX = dropX * scaleX
        const pdfY = pageHeight - dropY * scaleY

        // Create field at drop position (centered on cursor)
        // Checkboxes are smaller
        const fieldWidth = draggedFieldType === 'Checkbox' ? 20 : 200
        const fieldHeight = draggedFieldType === 'Checkbox' ? 20 : 30

        handleAddField(draggedFieldType, {
            pageNumber,
            x: pdfX - fieldWidth / 2,
            y: pdfY + fieldHeight / 2,
            width: fieldWidth,
            height: fieldHeight,
        })

        setDraggedFieldType(null)
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
            <div
                className={`mx-auto grid ${selectedFieldId ? 'max-w-[2000px] grid-cols-[240px_minmax(0,1fr)_320px]' : 'max-w-[1600px] grid-cols-[240px_minmax(0,1fr)]'} gap-4 items-start`}
            >
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
                                Add Fields
                            </div>
                            <div className="space-y-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    draggable
                                    onDragStart={() =>
                                        handleFieldDragStart('Text')
                                    }
                                    onDragEnd={handleFieldDragEnd}
                                    onClick={() => handleAddField('Text')}
                                    disabled={!pdfDoc}
                                    className="h-10 w-full justify-start rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    <Type className="mr-2 h-4 w-4" />
                                    Text Field
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    draggable
                                    onDragStart={() =>
                                        handleFieldDragStart('Checkbox')
                                    }
                                    onDragEnd={handleFieldDragEnd}
                                    onClick={() => handleAddField('Checkbox')}
                                    disabled={!pdfDoc}
                                    className="h-10 w-full justify-start rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Checkbox
                                </Button>
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
                                        variant={
                                            activeView === 'pdf'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        onClick={() => setActiveView('pdf')}
                                        className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <Eye className="mr-2 h-3 w-3" />
                                        PDF View
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            activeView === 'text'
                                                ? 'default'
                                                : 'ghost'
                                        }
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
                                            variant={
                                                showAcroFormLayer
                                                    ? 'default'
                                                    : 'ghost'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                setShowAcroFormLayer(
                                                    !showAcroFormLayer,
                                                )
                                            }
                                            className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ml-auto"
                                        >
                                            <Layers className="mr-2 h-3 w-3" />
                                            Fields ({extractedFields.length})
                                        </Button>
                                    )}
                                    {extractedTextBlocks.length > 0 && (
                                        <Button
                                            type="button"
                                            variant={
                                                showTextLayer
                                                    ? 'default'
                                                    : 'ghost'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                setShowTextLayer(!showTextLayer)
                                            }
                                            className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                                        >
                                            <Type className="mr-2 h-3 w-3" />
                                            Text ({extractedTextBlocks.length})
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {pdfDoc && activeView === 'pdf' && (
                                    <PdfViewer
                                        file={pdfBytes}
                                        className="w-full"
                                        pageWrapper={(page, context) => {
                                            // Filter fields for this page
                                            const pageFields =
                                                extractedFields.filter(
                                                    (f) =>
                                                        f.page ===
                                                        context.pageNumber,
                                                )

                                            // Filter text blocks for this page
                                            const pageTextBlocks =
                                                extractedTextBlocks.filter(
                                                    (tb) =>
                                                        tb.page ===
                                                        context.pageNumber,
                                                )

                                            // Filter graphic lines for this page
                                            const pageGraphicLines =
                                                extractedGraphicLines.filter(
                                                    (gl) =>
                                                        gl.page ===
                                                        context.pageNumber,
                                                )

                                            if (context.pageNumber === 1) {
                                                console.log(
                                                    `\ud83d\udcc4 Page ${context.pageNumber}:`,
                                                    {
                                                        showTextLayer,
                                                        pageTextBlocks,
                                                        totalTextBlocks:
                                                            extractedTextBlocks.length,
                                                    },
                                                )
                                            }

                                            let pageContainerElement: HTMLDivElement | null =
                                                null

                                            return (
                                                <div
                                                    key={context.pageNumber}
                                                    className="mb-6"
                                                >
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <div className="text-sm font-semibold text-slate-600">
                                                            Page{' '}
                                                            {context.pageNumber}
                                                        </div>
                                                        {pageFields.length >
                                                            0 && (
                                                            <div className="text-xs text-slate-500">
                                                                {
                                                                    pageFields.length
                                                                }{' '}
                                                                field
                                                                {pageFields.length !==
                                                                1
                                                                    ? 's'
                                                                    : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div
                                                        ref={(el) => {
                                                            pageContainerElement =
                                                                el
                                                        }}
                                                        className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                                                        onClick={() => {
                                                            // Deselect field and text block when clicking on page background
                                                            setSelectedFieldId(
                                                                null,
                                                            )
                                                            setSelectedTextBlockId(
                                                                null,
                                                            )
                                                        }}
                                                        onDragOver={(e) => {
                                                            if (
                                                                draggedFieldType
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
                                                            if (
                                                                pageContainerElement
                                                            ) {
                                                                handlePageDrop(
                                                                    e,
                                                                    context.pageNumber,
                                                                    pageContainerElement,
                                                                )
                                                            }
                                                        }}
                                                    >
                                                        <div className="relative">
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
                                                                                handleFieldPositionChange
                                                                            }
                                                                            onSelect={
                                                                                handleFieldSelect
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
                                                                    (
                                                                        textBlock,
                                                                    ) => (
                                                                        <TextBlockOverlay
                                                                            key={
                                                                                textBlock.id
                                                                            }
                                                                            textBlock={
                                                                                textBlock
                                                                            }
                                                                            onSelect={(
                                                                                id,
                                                                            ) => {
                                                                                setSelectedTextBlockId(
                                                                                    id,
                                                                                )
                                                                                setSelectedFieldId(
                                                                                    null,
                                                                                )
                                                                            }}
                                                                            isSelected={
                                                                                textBlock.id ===
                                                                                selectedTextBlockId
                                                                            }
                                                                        />
                                                                    ),
                                                                )}
                                                            {/* Graphics block overlays hidden for now */}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }}
                                    />
                                )}
                                {pdfDoc && activeView === 'text' && (
                                    <PdfTextEditor
                                        content={pdfDoc.toString()}
                                        readOnly={true}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Field Configuration Sidebar */}
                {selectedFieldId && selectedField && (
                    <Card className="sticky top-6 h-[calc(100vh-48px)] rounded-[24px] border-slate-200 shadow-sm overflow-hidden">
                        <CardContent className="flex h-full flex-col p-0">
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-slate-600" />
                                    <h2 className="font-semibold text-sm">
                                        Field Properties
                                    </h2>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFieldId(null)}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="field-name"
                                        className="text-xs font-semibold text-slate-700"
                                    >
                                        Field Name
                                    </Label>
                                    <Input
                                        id="field-name"
                                        value={selectedField.name}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) =>
                                            handleFieldPropertyChange(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="field-type"
                                        className="text-xs font-semibold text-slate-700"
                                    >
                                        Field Type
                                    </Label>
                                    <Input
                                        id="field-type"
                                        value={selectedField.type || 'Unknown'}
                                        disabled
                                        className="h-8 text-sm bg-slate-50"
                                    />
                                </div>

                                {/* Checkbox-specific properties */}
                                {selectedField.type === 'Checkbox' &&
                                    selectedField.fieldRef && (
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="default-state"
                                                className="text-xs font-semibold text-slate-700"
                                            >
                                                Default State
                                            </Label>
                                            <select
                                                id="default-state"
                                                value={
                                                    selectedField.fieldRef
                                                        .appearanceState ||
                                                    'Off'
                                                }
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLSelectElement>,
                                                ) => {
                                                    if (
                                                        selectedField.fieldRef
                                                    ) {
                                                        selectedField.fieldRef.appearanceState =
                                                            e.target.value
                                                        setPdfVersion(
                                                            (v) => v + 1,
                                                        )
                                                    }
                                                }}
                                                className="h-8 w-full text-sm rounded-md border border-slate-300 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                            >
                                                {selectedField.fieldRef.appearanceStates?.map(
                                                    (state: string) => (
                                                        <option
                                                            key={state}
                                                            value={state}
                                                        >
                                                            {state}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                    )}

                                {/* Text field properties */}
                                {selectedField.type !== 'Checkbox' && (
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="field-value"
                                            className="text-xs font-semibold text-slate-700"
                                        >
                                            Default Value
                                        </Label>
                                        <Input
                                            id="field-value"
                                            value={selectedField.value}
                                            onChange={(
                                                e: React.ChangeEvent<HTMLInputElement>,
                                            ) =>
                                                handleFieldPropertyChange(
                                                    'value',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}

                                {selectedField.fieldRef &&
                                    selectedField.fieldRef.fontSize !==
                                        undefined && (
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="font-size"
                                                className="text-xs font-semibold text-slate-700"
                                            >
                                                Font Size
                                            </Label>
                                            <Input
                                                id="font-size"
                                                type="number"
                                                value={
                                                    selectedField.fieldRef
                                                        .fontSize || 12
                                                }
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLInputElement>,
                                                ) =>
                                                    handleFieldPropertyChange(
                                                        'fontSize',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-8 text-sm"
                                                min="6"
                                                max="72"
                                            />
                                        </div>
                                    )}

                                {selectedField.rect && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-700">
                                            Position & Size
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="pos-x"
                                                    className="text-xs text-slate-600"
                                                >
                                                    X
                                                </Label>
                                                <Input
                                                    id="pos-x"
                                                    type="number"
                                                    value={selectedField.rect[0].toFixed(
                                                        2,
                                                    )}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        handleRectChange(
                                                            'x',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8 text-sm"
                                                    step="1"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="pos-y"
                                                    className="text-xs text-slate-600"
                                                >
                                                    Y
                                                </Label>
                                                <Input
                                                    id="pos-y"
                                                    type="number"
                                                    value={selectedField.rect[1].toFixed(
                                                        2,
                                                    )}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        handleRectChange(
                                                            'y',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8 text-sm"
                                                    step="1"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="width"
                                                    className="text-xs text-slate-600"
                                                >
                                                    Width
                                                </Label>
                                                <Input
                                                    id="width"
                                                    type="number"
                                                    value={(
                                                        selectedField.rect[2] -
                                                        selectedField.rect[0]
                                                    ).toFixed(2)}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        handleRectChange(
                                                            'width',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8 text-sm"
                                                    step="1"
                                                    min="1"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="height"
                                                    className="text-xs text-slate-600"
                                                >
                                                    Height
                                                </Label>
                                                <Input
                                                    id="height"
                                                    type="number"
                                                    value={(
                                                        selectedField.rect[3] -
                                                        selectedField.rect[1]
                                                    ).toFixed(2)}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        handleRectChange(
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
                                        className="text-xs font-semibold text-slate-700"
                                    >
                                        Page Number
                                    </Label>
                                    <Input
                                        id="page-num"
                                        value={selectedField.page}
                                        disabled
                                        className="h-8 text-sm bg-slate-50"
                                    />
                                </div>

                                <Separator className="my-4" />

                                <div className="space-y-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            handleCloneField(selectedField.id)
                                        }
                                        className="w-full h-10 hover:bg-slate-50"
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
                                                    `Are you sure you want to delete the field "${selectedField.name}"?`,
                                                )
                                            ) {
                                                handleRemoveField(
                                                    selectedField.id,
                                                )
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
                )}
            </div>
        </div>
    )
}
