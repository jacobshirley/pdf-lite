import React, { useState, useCallback } from 'react'
import type { ExtractedGraphicsBlock } from '../../types'

type ResizeEdge = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'

type Props = {
    graphicsBlock: ExtractedGraphicsBlock
    isSelected?: boolean
    onPositionChange: (blockId: string, dx: number, dy: number) => void
    onResize?: (blockId: string, newWidth: number, newHeight: number, dx: number, dy: number) => void
    onSelect?: (blockId: string) => void
}

export function GraphicsBlockOverlay({ graphicsBlock, isSelected, onPositionChange, onResize, onSelect }: Props) {
    const { bbox, pageHeight, pageWidth } = graphicsBlock

    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [resizeEdge, setResizeEdge] = useState<ResizeEdge | null>(null)
    const [didDrag, setDidDrag] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [tempPosition, setTempPosition] = useState<{ left: number; top: number } | null>(null)
    const [tempSize, setTempSize] = useState<{ width: number; height: number; left: number; top: number } | null>(null)
    const [resizeStart, setResizeStart] = useState({ clientX: 0, clientY: 0, parentWidth: 0, parentHeight: 0 })

    if (bbox.width === 0 && bbox.height === 0) return null

    const leftPercent = (bbox.x / pageWidth) * 100
    const topPercent = ((pageHeight - (bbox.y + bbox.height)) / pageHeight) * 100
    const widthPercent = (bbox.width / pageWidth) * 100
    const heightPercent = (bbox.height / pageHeight) * 100

    const displayLeft = tempPosition ? `${tempPosition.left}%` : tempSize ? `${tempSize.left}%` : `${leftPercent}%`
    const displayTop = tempPosition ? `${tempPosition.top}%` : tempSize ? `${tempSize.top}%` : `${topPercent}%`
    const displayWidth = tempSize ? `${tempSize.width}%` : `${widthPercent}%`
    const displayHeight = tempSize ? `${tempSize.height}%` : `${Math.max(heightPercent, 0.3)}%`

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const target = e.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setIsDragging(true)
        setDidDrag(false)
    }

    const handleResizeStart = (e: React.MouseEvent, edge: ResizeEdge) => {
        e.preventDefault()
        e.stopPropagation()
        const el = document.querySelector(`[data-graphics-id="${graphicsBlock.id}"]`) as HTMLElement
        if (!el) return
        const parent = el.offsetParent as HTMLElement
        if (!parent) return
        const parentRect = parent.getBoundingClientRect()
        setResizeEdge(edge)
        setIsResizing(true)
        setResizeStart({
            clientX: e.clientX,
            clientY: e.clientY,
            parentWidth: parentRect.width,
            parentHeight: parentRect.height,
        })
    }

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing && resizeEdge) {
            const dxPx = e.clientX - resizeStart.clientX
            const dyPx = e.clientY - resizeStart.clientY
            const dxPct = (dxPx / resizeStart.parentWidth) * 100
            const dyPct = (dyPx / resizeStart.parentHeight) * 100

            let newLeft = leftPercent
            let newTop = topPercent
            let newWidth = widthPercent
            let newHeight = heightPercent

            if (resizeEdge.includes('e')) newWidth = Math.max(1, widthPercent + dxPct)
            if (resizeEdge.includes('w')) {
                newWidth = Math.max(1, widthPercent - dxPct)
                newLeft = leftPercent + dxPct
            }
            if (resizeEdge.includes('s')) newHeight = Math.max(0.5, heightPercent + dyPct)
            if (resizeEdge.includes('n')) {
                newHeight = Math.max(0.5, heightPercent - dyPct)
                newTop = topPercent + dyPct
            }

            setTempSize({ width: newWidth, height: newHeight, left: newLeft, top: newTop })
            return
        }

        if (!isDragging) return
        setDidDrag(true)
        const target = document.querySelector(
            `[data-graphics-id="${graphicsBlock.id}"]`,
        ) as HTMLElement
        if (!target) return
        const parent = target.offsetParent as HTMLElement
        if (!parent) return
        const parentRect = parent.getBoundingClientRect()
        setTempPosition({
            left: ((e.clientX - parentRect.left - dragOffset.x) / parentRect.width) * 100,
            top: ((e.clientY - parentRect.top - dragOffset.y) / parentRect.height) * 100,
        })
    }, [isDragging, isResizing, resizeEdge, dragOffset, resizeStart, graphicsBlock.id, leftPercent, topPercent, widthPercent, heightPercent])

    const handleMouseUp = useCallback(() => {
        if (isResizing && tempSize) {
            const newPdfWidth = (tempSize.width / 100) * pageWidth
            const newPdfHeight = (tempSize.height / 100) * pageHeight
            const pdfDx = ((tempSize.left - leftPercent) / 100) * pageWidth
            const pdfDy = -((tempSize.top - topPercent) / 100) * pageHeight
            onResize?.(graphicsBlock.id, newPdfWidth, newPdfHeight, pdfDx, pdfDy)
            setTempSize(null)
            setIsResizing(false)
            setResizeEdge(null)
            return
        }

        if (isDragging && tempPosition) {
            const pdfDx = ((tempPosition.left - leftPercent) / 100) * pageWidth
            const pdfDy = -((tempPosition.top - topPercent) / 100) * pageHeight
            if (Math.abs(pdfDx) > 0.5 || Math.abs(pdfDy) > 0.5) {
                onPositionChange(graphicsBlock.id, pdfDx, pdfDy)
            }
            setTempPosition(null)
        } else if (isDragging && !didDrag) {
            onSelect?.(graphicsBlock.id)
        }
        setIsDragging(false)
    }, [isDragging, isResizing, tempPosition, tempSize, didDrag, leftPercent, topPercent, pageWidth, pageHeight, graphicsBlock.id, onPositionChange, onResize, onSelect])

    React.useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

    const handleStyle: React.CSSProperties = {
        position: 'absolute',
        width: 8,
        height: 8,
        backgroundColor: 'white',
        border: '1.5px solid rgba(59, 130, 246, 0.9)',
        borderRadius: 1,
        zIndex: 25,
    }

    return (
        <div
            className="graphics-block-overlay"
            data-graphics-id={graphicsBlock.id}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'absolute',
                left: displayLeft,
                top: displayTop,
                width: displayWidth,
                height: displayHeight,
                border: isDragging
                    ? '1px solid rgba(220, 38, 38, 0.8)'
                    : isSelected
                      ? '2px solid rgba(59, 130, 246, 0.8)'
                      : '1px solid rgba(220, 38, 38, 0.4)',
                backgroundColor: isDragging
                    ? 'rgba(220, 38, 38, 0.15)'
                    : isSelected
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(220, 38, 38, 0.08)',
                borderRadius: '1px',
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: isDragging ? 20 : isSelected ? 15 : 5,
                transition: (isDragging || isResizing) ? 'none' : 'all 0.15s ease',
            }}
            title="Graphics block"
        >
            {isSelected && !isDragging && (
                <>
                    <div onMouseDown={(e) => handleResizeStart(e, 'nw')} style={{ ...handleStyle, top: -4, left: -4, cursor: 'nwse-resize' }} />
                    <div onMouseDown={(e) => handleResizeStart(e, 'ne')} style={{ ...handleStyle, top: -4, right: -4, cursor: 'nesw-resize' }} />
                    <div onMouseDown={(e) => handleResizeStart(e, 'sw')} style={{ ...handleStyle, bottom: -4, left: -4, cursor: 'nesw-resize' }} />
                    <div onMouseDown={(e) => handleResizeStart(e, 'se')} style={{ ...handleStyle, bottom: -4, right: -4, cursor: 'nwse-resize' }} />
                    <div onMouseDown={(e) => handleResizeStart(e, 'n')} style={{ ...handleStyle, top: -4, left: '50%', marginLeft: -4, cursor: 'ns-resize' }} />
                    <div onMouseDown={(e) => handleResizeStart(e, 's')} style={{ ...handleStyle, bottom: -4, left: '50%', marginLeft: -4, cursor: 'ns-resize' }} />
                    <div onMouseDown={(e) => handleResizeStart(e, 'w')} style={{ ...handleStyle, top: '50%', left: -4, marginTop: -4, cursor: 'ew-resize' }} />
                    <div onMouseDown={(e) => handleResizeStart(e, 'e')} style={{ ...handleStyle, top: '50%', right: -4, marginTop: -4, cursor: 'ew-resize' }} />
                </>
            )}
        </div>
    )
}
