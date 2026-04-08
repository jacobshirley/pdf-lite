export class ContentOp {
    raw?: string

    constructor(raw: string) {
        this.raw = raw
    }

    parts(): {
        operator: string
        operands: string[]
    } {
        if (!this.raw) return { operator: '', operands: [] }
        const parts = this.raw.split(' ')
        const operator = parts[parts.length - 1]
        const operands = parts.slice(0, -1)
        return { operator, operands }
    }

    toString(): string {
        return this.raw ?? ''
    }
}
