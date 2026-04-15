import React, { useState } from 'react'
import type { ExtractedField } from '../../types'

type Props = {
    field: ExtractedField
    onPositionChange: (
        fieldId: string,
        newRect: [number, number, number, number],
    ) => void
    onSelect: (fieldId: string) => void
    isSelected: boolean
}

export function FieldOverlay({
    field,
    onPositionChange,
    onSelect,
    isSelected,
}: Props) {
    if (!field.rect) return null

    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState<string | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [tempPosition, setTempPosition] = useState<{
        left: number
        top: number
    } | null>(null)
    const [tempSize, setTempSize] = useState<{
        width: number
        height: number
    } | null>(null)

    const [x1, y1, x2, y2] = field.rect
    const fieldWidth = x2 - x1
    const fieldHeight = y2 - y1

    const leftPercent = (x1 / field.pageWidth) * 100
    const topPercent = ((field.pageHeight - y2) / field.pageHeight) * 100
    const widthPercent = (fieldWidth / field.pageWidth) * 100
    const heightPercent = (fieldHeight / field.pageHeight) * 100

    const displayLeft = tempPosition
        ? `${tempPosition.left}%`
        : `${leftPercent}%`
    const displayTop = tempPosition ? `${tempPosition.top}%` : `${topPercent}%`
    const displayWidth = tempSize ? `${tempSize.width}%` : `${widthPercent}%`
    const displayHeight = tempSize ? `${tempSize.height}%` : `${heightPercent}%`

    const isWidgetOnly = field.hasParent

    const colorMap: Record<string, string> = {
        Text: 'rgba(59, 130, 246, 0.3)',
        Button: 'rgba(147, 51, 234, 0.3)',
        Checkbox: 'rgba(16, 185, 129, 0.3)',
        Choice: 'rgba(245, 158, 11, 0.3)',
        Signature: 'rgba(239, 68, 68, 0.3)',
    }

    const backgroundColor = isWidgetOnly
        ? 'rgba(34, 197, 94, 0.35)'
        : field.type
          ? colorMap[field.type]
          : 'rgba(156, 163, 175, 0.3)'

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

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
            const newLeft = e.clientX - parentRect.left - dragOffset.x
            const newTop = e.clientY - parentRect.top - dragOffset.y

            const newLeftPercent = (newLeft / parentRect.width) * 100
            const newTopPercent = (newTop / parentRect.height) * 100

            setTempPosition({ left: newLeftPercent, top: newTopPercent })
        } else if (isResizing) {
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

            const minWidth = 20
            const minHeight = 10
            if (newWidth < minWidth) newWidth = minWidth
            if (newHeight < minHeight) newHeight = minHeight

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
            const newLeftPercent = tempPosition.left
            const newTopPercent = tempPosition.top

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

            onSelect(field.id)
        } else if (isResizing && tempPosition && tempSize) {
            const newLeftPercent = tempPosition.left
            const newTopPercent = tempPosition.top
            const newWidthPercent = tempSize.width
            const newHeightPercent = tempSize.height

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
            {isSelected && (
                <>
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
