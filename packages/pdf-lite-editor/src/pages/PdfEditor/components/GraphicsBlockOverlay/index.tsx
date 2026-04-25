import React, { useState } from 'react'
import type { ExtractedGraphicsBlock } from '../../types'

type Props = {
    graphicsBlock: ExtractedGraphicsBlock
    onPositionChange: (blockId: string, dx: number, dy: number) => void
}

export function GraphicsBlockOverlay({ graphicsBlock, onPositionChange }: Props) {
    const { bbox, pageHeight, pageWidth } = graphicsBlock

    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [tempPosition, setTempPosition] = useState<{ left: number; top: number } | null>(null)

    if (bbox.width === 0 && bbox.height === 0) return null

    const leftPercent = (bbox.x / pageWidth) * 100
    const topPercent = ((pageHeight - (bbox.y + bbox.height)) / pageHeight) * 100
    const widthPercent = (bbox.width / pageWidth) * 100
    const heightPercent = (bbox.height / pageHeight) * 100

    const displayLeft = tempPosition ? `${tempPosition.left}%` : `${leftPercent}%`
    const displayTop = tempPosition ? `${tempPosition.top}%` : `${topPercent}%`

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const target = e.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setIsDragging(true)
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
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
    }

    const handleMouseUp = () => {
        if (isDragging && tempPosition) {
            const pdfDx = ((tempPosition.left - leftPercent) / 100) * pageWidth
            const pdfDy = -((tempPosition.top - topPercent) / 100) * pageHeight
            if (Math.abs(pdfDx) > 0.5 || Math.abs(pdfDy) > 0.5) {
                onPositionChange(graphicsBlock.id, pdfDx, pdfDy)
            }
            setTempPosition(null)
        }
        setIsDragging(false)
    }

    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, dragOffset, tempPosition])

    return (
        <div
            className="graphics-block-overlay"
            data-graphics-id={graphicsBlock.id}
            onMouseDown={handleMouseDown}
            style={{
                position: 'absolute',
                left: displayLeft,
                top: displayTop,
                width: `${widthPercent}%`,
                height: `${Math.max(heightPercent, 0.3)}%`,
                border: isDragging
                    ? '1px solid rgba(220, 38, 38, 0.8)'
                    : '1px solid rgba(220, 38, 38, 0.4)',
                backgroundColor: isDragging
                    ? 'rgba(220, 38, 38, 0.15)'
                    : 'rgba(220, 38, 38, 0.08)',
                borderRadius: '1px',
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: isDragging ? 20 : 5,
                transition: isDragging ? 'none' : 'all 0.15s ease',
            }}
            title="Graphics block"
        />
    )
}
