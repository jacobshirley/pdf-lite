import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import { pdfjs, Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import type { TestProps } from '../types.js'

// Use the worker from node_modules with Vite's ?url import
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Observes a given element using ResizeObserver.
 *
 * @param {Element} [element] Element to attach ResizeObserver to
 * @param {ResizeObserverOptions} [options] ResizeObserver options. WARNING! If you define the
 *   object in component body, make sure to memoize it.
 * @param {ResizeObserverCallback} observerCallback ResizeObserver callback. WARNING! If you define
 *   the function in component body, make sure to memoize it.
 * @returns {void}
 */
export default function useResizeObserver(
    element: Element | null,
    options: ResizeObserverOptions | undefined,
    observerCallback: ResizeObserverCallback,
): void {
    useEffect(() => {
        if (!element || !('ResizeObserver' in window)) {
            return undefined
        }

        const observer = new ResizeObserver(observerCallback)

        observer.observe(element, options)

        return () => {
            observer.disconnect()
        }
    }, [element, options, observerCallback])
}

// Memoized page component that only re-renders when its specific props change
const PdfPage = memo<{
    pageNumber: number
    width?: number
    fileKey: string | undefined
}>(({ pageNumber, width, fileKey }) => {
    return (
        <Page
            key={`${fileKey}_page_${pageNumber}`}
            pageNumber={pageNumber}
            width={width}
        />
    )
})

export interface PdfViewerProps extends TestProps {
    file: string | File | Uint8Array | Blob
    className?: string
    scrollTop?: number
    pageWrapper?: (page: React.ReactNode, context: { pageNumber: number }) => React.ReactNode
}

const MAX_RESIZE_TRIGGER_DIFFERENCE_PX = 20

export function PdfViewer(props: PdfViewerProps) {
    const { pageWrapper = (page) => page } = props
    const [numberOfPages, setNumberOfPages] = useState<number>(0)
    const [isDocumentReady, setIsDocumentReady] = useState<boolean>(false)

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [containerWidth, setContainerWidth] = useState<number>()

    const onResize = useCallback<ResizeObserverCallback>((entries) => {
        const [entry] = entries

        if (!entry) {
            return
        }

        const newWidth = entry.contentRect.width
        // Only update if the width has changed by more than MAX_RESIZE_TRIGGER_DIFFERENCE_PX to avoid infinite loops
        // (We don't need to track height since it's not used in rendering)
        setContainerWidth((prevWidth) => {
            if (
                prevWidth === undefined ||
                Math.abs(newWidth - prevWidth) >
                    MAX_RESIZE_TRIGGER_DIFFERENCE_PX
            ) {
                return newWidth
            }
            return prevWidth
        })
    }, [])

    useResizeObserver(containerRef.current, {}, onResize)

    const fileKey = typeof props.file === 'string' ? props.file : undefined

    const document = useMemo(() => {
        return (
            <Document
                key={fileKey}
                file={props.file as any}
                onLoadError={(error) => {
                    alert('Error while loading PDF:' + error)
                }}
                onLoadSuccess={({ numPages }) => {
                    setNumberOfPages(numPages)
                    setIsDocumentReady(true)
                }}
                data-testid={props.dataTestId}
            >
                {isDocumentReady &&
                    Array.from(new Array(numberOfPages), (_el, index) => (
                        pageWrapper(
                            <PdfPage
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                width={containerWidth}
                                fileKey={fileKey}
                            />,
                            {
                                pageNumber: index + 1,
                            }
                        )
                    ))}
            </Document>
        )
    }, [
        props.file,
        fileKey,
        props.dataTestId,
        isDocumentReady,
        numberOfPages,
        containerWidth,
    ])

    return (
        <div className={props.className} ref={containerRef}>
            {document}
        </div>
    )
}
