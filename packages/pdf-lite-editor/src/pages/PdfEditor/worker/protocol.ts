export type FieldType = 'Text' | 'Checkbox' | 'Button' | 'Choice' | 'Signature'

export type EncryptionAlgorithm = 'AES-256' | 'AES-128' | 'RC4-128' | 'RC4-40'

export type Rect4 = [number, number, number, number]

export type BBox = { x: number; y: number; width: number; height: number }

export type SignatureMetadataDTO = {
    signerName?: string
    reason?: string
    location?: string
    contactInfo?: string
    hasCredential: boolean
    certSubject?: string
}

export type FieldDTO = {
    id: string
    name: string
    type: FieldType | string
    page: number
    rect: Rect4
    value: string
    pageHeight: number
    pageWidth: number
    fontSize?: number
    quadding?: number
    appearanceState?: string
    appearanceStates?: string[]
    defaultAppearance?: string
    hasParent: boolean
    options?: { label: string; value: string }[]
    signature?: SignatureMetadataDTO
}

export type TextSegmentDTO = {
    text: string
    fontName: string
    fontType: string
    fontSize: number
    colorHex: string
}

export type TextBlockDTO = {
    id: string
    page: number
    pageHeight: number
    pageWidth: number
    bbox: BBox
    text: string
    runs: TextSegmentDTO[]
}

export type GraphicsBlockDTO = {
    id: string
    page: number
    pageHeight: number
    pageWidth: number
    bbox: BBox
    shapeType?: GraphicsShapeType
    colorHex?: string
    fill?: boolean
    fillColorHex?: string
    strokeColorHex?: string
    strokeWidth?: number
    linePoints?: { x1: number; y1: number; x2: number; y2: number }
}

export type ExtractResult = {
    fields: FieldDTO[]
    textBlocks: TextBlockDTO[]
    graphicsBlocks: GraphicsBlockDTO[]
    pageCount: number
}

export type FontRef = {
    id: string
    name: string
    kind: 'standard' | 'embedded'
    fontType: string
}

export type AddFieldOptions = {
    pageNumber?: number
    x?: number
    y?: number
    width?: number
    height?: number
}

export type RemoveFieldResult = {
    removedId: string
}

export type AddTextBlockOptions = {
    pageNumber?: number
    x?: number
    y?: number
    text?: string
    fontSize?: number
}

export type RemoveTextBlockResult = {
    removedId: string
}

export type GraphicsShapeType = 'Line' | 'Rectangle' | 'Ellipse' | 'Image'

export type AddGraphicsBlockOptions = {
    shape: GraphicsShapeType
    pageNumber?: number
    x?: number
    y?: number
    width?: number
    height?: number
    rgb?: [number, number, number]
    fill?: boolean
    imageBytes?: Uint8Array
}

export type RemoveGraphicsBlockResult = {
    removedId: string
}

export type CloneFieldResult = {
    newField: FieldDTO
    updatedOriginalId?: string
    updatedOriginalName?: string
    updatedOriginalValue?: string
}

export type WorkerMethods = {
    load: {
        args: { bytes: Uint8Array; password?: string }
        result: ExtractResult
    }
    createBlank: {
        args: { width?: number; height?: number }
        result: ExtractResult
    }
    toBytes: {
        args: void
        result: Uint8Array
    }
    toBytesWithPassword: {
        args: {
            password: string
            ownerPassword?: string
            algorithm?: EncryptionAlgorithm
        }
        result: Uint8Array
    }
    toDebugString: {
        args: void
        result: string
    }
    listStandardFonts: {
        args: void
        result: FontRef[]
    }
    uploadFont: {
        args: { bytes: Uint8Array; fallbackName: string }
        result: FontRef
    }
    addTextBlock: {
        args: { options?: AddTextBlockOptions }
        result: TextBlockDTO
    }
    removeTextBlock: {
        args: { id: string }
        result: RemoveTextBlockResult
    }
    addGraphicsBlock: {
        args: { options: AddGraphicsBlockOptions }
        result: GraphicsBlockDTO
    }
    removeGraphicsBlock: {
        args: { id: string }
        result: RemoveGraphicsBlockResult
    }
    moveGraphicsBlock: {
        args: { id: string; dx: number; dy: number }
        result: GraphicsBlockDTO
    }
    setGraphicsBlockGeometry: {
        args: {
            id: string
            x: number
            y: number
            width: number
            height: number
        }
        result: GraphicsBlockDTO
    }
    moveLineEndpoint: {
        args: { id: string; endpointIndex: 0 | 1; dx: number; dy: number }
        result: GraphicsBlockDTO
    }
    updateGraphicsBlock: {
        args: {
            id: string
            rgb?: [number, number, number]
            fill?: boolean
            fillRgb?: [number, number, number] | null
            strokeRgb?: [number, number, number] | null
            strokeWidth?: number
        }
        result: GraphicsBlockDTO
    }
    editTextBlock: {
        args: { id: string; text: string }
        result: TextBlockDTO
    }
    moveTextBlock: {
        args: { id: string; dx: number; dy: number }
        result: TextBlockDTO
    }
    setTextBlockFont: {
        args: { id: string; fontRefId: string }
        result: TextBlockDTO
    }
    setTextBlockColor: {
        args: { id: string; r: number; g: number; b: number }
        result: TextBlockDTO
    }
    setTextBlockFontSize: {
        args: { id: string; fontSize: number }
        result: TextBlockDTO
    }
    addPage: {
        args: { width?: number; height?: number }
        result: ExtractResult
    }
    removePage: {
        args: { pageNumber: number }
        result: ExtractResult
    }
    updateFieldProperty: {
        args: {
            id: string
            property: 'name' | 'value' | 'fontSize'
            value: string
        }
        result: FieldDTO[]
    }
    updateFieldRect: {
        args: { id: string; rect: Rect4 }
        result: FieldDTO
    }
    setAppearanceState: {
        args: { id: string; value: string }
        result: FieldDTO[]
    }
    addField: {
        args: { type: FieldType; options?: AddFieldOptions }
        result: FieldDTO
    }
    updateFieldOptions: {
        args: { id: string; options: { label: string; value: string }[] }
        result: FieldDTO
    }
    setSignatureCredential: {
        args: { id: string; pfxBytes: Uint8Array; password: string }
        result: FieldDTO
    }
    clearSignatureCredential: {
        args: { id: string }
        result: FieldDTO
    }
    updateSignatureMetadata: {
        args: {
            id: string
            property: 'signerName' | 'reason' | 'location' | 'contactInfo'
            value: string
        }
        result: FieldDTO
    }
    removeField: {
        args: { id: string }
        result: RemoveFieldResult
    }
    cloneField: {
        args: { id: string }
        result: CloneFieldResult
    }
    reset: {
        args: void
        result: void
    }
    undo: {
        args: void
        result: ExtractResult & { canUndo: boolean; canRedo: boolean }
    }
    redo: {
        args: void
        result: ExtractResult & { canUndo: boolean; canRedo: boolean }
    }
    getUndoRedoState: {
        args: void
        result: { canUndo: boolean; canRedo: boolean }
    }
}

export type WorkerMethodName = keyof WorkerMethods

export type WorkerRequest<M extends WorkerMethodName = WorkerMethodName> = {
    id: number
    method: M
    args: WorkerMethods[M]['args']
}

export type WorkerResponse<M extends WorkerMethodName = WorkerMethodName> =
    | { id: number; ok: true; result: WorkerMethods[M]['result'] }
    | { id: number; ok: false; error: string }
