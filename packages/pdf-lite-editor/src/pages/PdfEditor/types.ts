import type { PdfFormField, TextBlock, GraphicsBlock } from 'pdf-lite'

export type FieldType = 'Text' | 'Checkbox' | 'Button' | 'Choice' | 'Signature'

export type ExtractedField = {
    id: string
    name: string
    type: FieldType | null
    page: number
    rect: [number, number, number, number] | null
    value: string
    pageHeight: number
    pageWidth: number
    fieldRef?: PdfFormField
}

export type ExtractedTextBlock = {
    block: TextBlock
    id: string
    page: number
    pageHeight: number
    pageWidth: number
}

export type ExtractedGraphicsBlock = {
    block: GraphicsBlock
    id: string
    page: number
    pageHeight: number
    pageWidth: number
}
