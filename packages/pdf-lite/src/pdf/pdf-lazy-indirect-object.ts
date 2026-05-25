import { PdfIndirectObject, PdfObject } from '../core'
import { PdfObjectManager } from './pdf-object-manager'

export class PdfLazyObject extends PdfIndirectObject {
    private _resolvedObject?: PdfObject

    constructor(
        objectManager: PdfObjectManager,
        options: {
            objectNumber: number
            generationNumber?: number
            offset: number
        },
    ) {
        super(options)

        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // Only short-circuit object identity properties before resolve
                if (prop === 'objectNumber' || prop === 'generationNumber') {
                    return options[prop as 'objectNumber' | 'generationNumber']
                }

                target._resolvedObject ??= objectManager.parseObject(
                    options.offset,
                )
                if (!target._resolvedObject) {
                    throw new Error(
                        `Failed to resolve object at offset ${options.offset}`,
                    )
                }

                // For 'becomes', delegate to _resolvedObject so prototype
                // mutations (e.g. PdfPage getters) take effect on the resolved
                // object that all subsequent accesses forward to.
                if (prop === 'becomes') {
                    const becomes = Reflect.get(
                        target._resolvedObject,
                        'becomes',
                        target._resolvedObject,
                    ) as Function
                    return (cls: any) => {
                        const result = becomes.call(target._resolvedObject, cls)
                        return result
                    }
                }

                return Reflect.get(target._resolvedObject, prop, receiver)
            },
        })
    }
}
