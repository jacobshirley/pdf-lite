import PdfWorker from './pdfWorker.ts?worker'
import type {
    WorkerMethodName,
    WorkerMethods,
    WorkerRequest,
    WorkerResponse,
} from './protocol'

type Pending = {
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
}

export class PdfWorkerClient {
    private worker: Worker | null = null
    private pending = new Map<number, Pending>()
    private nextId = 1

    private ensureWorker(): Worker {
        if (this.worker) return this.worker
        const w = new PdfWorker()
        w.addEventListener('message', this.handleMessage)
        w.addEventListener('error', (e) => {
            console.error('[PdfWorker] error', e.message, e.filename, e.lineno)
        })
        this.worker = w
        return w
    }

    private handleMessage = (e: MessageEvent<WorkerResponse>) => {
        const { id } = e.data
        const entry = this.pending.get(id)
        if (!entry) return
        this.pending.delete(id)
        if (e.data.ok) {
            entry.resolve(e.data.result)
        } else {
            entry.reject(new Error(e.data.error))
        }
    }

    call<M extends WorkerMethodName>(
        method: M,
        args: WorkerMethods[M]['args'],
        transfer?: Transferable[],
    ): Promise<WorkerMethods[M]['result']> {
        const id = this.nextId++
        const request: WorkerRequest<M> = { id, method, args }
        const worker = this.ensureWorker()
        return new Promise((resolve, reject) => {
            this.pending.set(id, {
                resolve: resolve as (v: unknown) => void,
                reject,
            })
            worker.postMessage(request, transfer ?? [])
        })
    }

    terminate() {
        if (!this.worker) return
        this.worker.removeEventListener('message', this.handleMessage)
        this.worker.terminate()
        this.worker = null
        for (const { reject } of this.pending.values()) {
            reject(new Error('Worker terminated'))
        }
        this.pending.clear()
    }
}

let sharedClient: PdfWorkerClient | null = null

export function getSharedPdfWorkerClient(): PdfWorkerClient {
    if (!sharedClient) {
        sharedClient = new PdfWorkerClient()
    }
    return sharedClient
}
