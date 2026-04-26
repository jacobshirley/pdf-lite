import { PdfIndirectObject, PdfObject } from '../core'
import { PdfLazyObjectManager } from './pdf-object-manager'

export class PdfLazyObject extends PdfIndirectObject {
    private _resolvedObject?: PdfObject

    constructor(
        objectManager: PdfLazyObjectManager,
        options: {
            objectNumber: number
            generationNumber?: number
            offset: number
        },
    ) {
        super(options)

        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (typeof prop === 'string' && Object.hasOwn(options, prop)) {
                    return options[prop as keyof typeof options]
                }

                target._resolvedObject ??= objectManager.parseObject(
                    options.offset,
                )
                if (!target._resolvedObject) {
                    throw new Error(
                        `Failed to resolve object at offset ${options.offset}`,
                    )
                }

                return Reflect.get(target._resolvedObject, prop, receiver)
            },
        })
    }
}
