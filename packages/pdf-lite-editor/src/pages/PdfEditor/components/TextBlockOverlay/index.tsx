import React, { useState } from 'react'
import type { ExtractedTextBlock } from '../../types'

type Props = {
    textBlock: ExtractedTextBlock
    onSelect: (blockId: string) => void
    isSelected: boolean
    isEditing: boolean
    editText: string
    onDoubleClick: (blockId: string) => void
    onEditChange: (text: string) => void
    onEditCommit: () => void
    onEditCancel: () => void
    onPositionChange: (blockId: string, dx: number, dy: number) => void
}

export function TextBlockOverlay({
    textBlock,
    onSelect,
    isSelected,
    isEditing,
    editText,
    onDoubleClick,
    onEditChange,
    onEditCommit,
    onEditCancel,
    onPositionChange,
}: Props) {
    const { block, pageHeight, pageWidth } = textBlock
    const bbox = block.getWorldBoundingBox()

    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [tempPosition, setTempPosition] = useState<{
        left: number
        top: number
    } | null>(null)

    const leftPercent = (bbox.x / pageWidth) * 100
    const topPercent =
        ((pageHeight - (bbox.y + bbox.height)) / pageHeight) * 100
    const widthPercent = (bbox.width / pageWidth) * 100
    const heightPercent = (bbox.height / pageHeight) * 100

    const displayLeft = tempPosition
        ? `${tempPosition.left}%`
        : `${leftPercent}%`
    const displayTop = tempPosition
        ? `${tempPosition.top}%`
        : `${topPercent}%`

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditing) return
        e.preventDefault()
        e.stopPropagation()

        const target = e.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()

        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
        setIsDragging(true)
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        const target = document.querySelector(
            `[data-textblock-id="${textBlock.id}"]`,
        ) as HTMLElement
        if (!target) return
        const parent = target.offsetParent as HTMLElement
        if (!parent) return

        const parentRect = parent.getBoundingClientRect()
        const newLeft = e.clientX - parentRect.left - dragOffset.x
        const newTop = e.clientY - parentRect.top - dragOffset.y

        setTempPosition({
            left: (newLeft / parentRect.width) * 100,
            top: (newTop / parentRect.height) * 100,
        })
    }

    const handleMouseUp = () => {
        if (isDragging && tempPosition) {
            const cssLeftDelta = tempPosition.left - leftPercent
            const cssTopDelta = tempPosition.top - topPercent

            const pdfDx = (cssLeftDelta / 100) * pageWidth
            const pdfDy = -(cssTopDelta / 100) * pageHeight

            if (Math.abs(pdfDx) > 0.5 || Math.abs(pdfDy) > 0.5) {
                onPositionChange(textBlock.id, pdfDx, pdfDy)
            }

            setTempPosition(null)
            onSelect(textBlock.id)
        } else if (isDragging) {
            onSelect(textBlock.id)
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
            className="text-block-overlay"
            data-textblock-id={textBlock.id}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation()
                if (!isEditing && !isDragging) onSelect(textBlock.id)
            }}
            onDoubleClick={(e) => {
                e.stopPropagation()
                onDoubleClick(textBlock.id)
            }}
            style={{
                position: 'absolute',
                left: displayLeft,
                top: displayTop,
                width: isEditing
                    ? `${Math.max(widthPercent, 20)}%`
                    : `${widthPercent}%`,
                height: `${heightPercent}%`,
                border: isEditing
                    ? '2px solid rgba(59, 130, 246, 1)'
                    : isSelected
                      ? '2px solid rgba(234, 88, 12, 1)'
                      : '1px solid rgba(234, 88, 12, 0.4)',
                backgroundColor: isEditing
                    ? 'rgba(255, 255, 255, 0.95)'
                    : isSelected
                      ? 'rgba(234, 88, 12, 0.15)'
                      : 'rgba(234, 88, 12, 0.08)',
                borderRadius: '2px',
                pointerEvents: 'auto',
                zIndex: isDragging ? 20 : isEditing ? 25 : isSelected ? 15 : 10,
                cursor: isEditing
                    ? 'text'
                    : isDragging
                      ? 'grabbing'
                      : 'grab',
                transition:
                    isEditing || isDragging ? 'none' : 'all 0.15s ease',
                overflow: 'visible',
            }}
            title={isEditing ? undefined : `Text: "${block.text}"`}
        >
            {isEditing && (
                <input
                    autoFocus
                    value={editText}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            onEditCommit()
                        } else if (e.key === 'Escape') {
                            e.preventDefault()
                            onEditCancel()
                        }
                    }}
                    onBlur={onEditCommit}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        padding: '0 2px',
                        boxSizing: 'border-box',
                    }}
                />
            )}
        </div>
    )
}
