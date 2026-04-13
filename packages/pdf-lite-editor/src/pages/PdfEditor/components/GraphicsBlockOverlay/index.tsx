import type { ExtractedGraphicsBlock } from '../../types'

type Props = {
    graphicsBlock: ExtractedGraphicsBlock
}

export function GraphicsBlockOverlay({ graphicsBlock }: Props) {
    const { block, pageHeight, pageWidth } = graphicsBlock
    const bbox = block.getWorldBoundingBox()

    if (bbox.width === 0 && bbox.height === 0) return null

    const leftPercent = (bbox.x / pageWidth) * 100
    const topPercent = ((pageHeight - (bbox.y + bbox.height)) / pageHeight) * 100
    const widthPercent = (bbox.width / pageWidth) * 100
    const heightPercent = (bbox.height / pageHeight) * 100

    return (
        <div
            className="graphics-block-overlay"
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
            title="Graphics block"
        />
    )
}
