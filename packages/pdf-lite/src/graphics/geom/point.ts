import { Matrix } from './matrix'

export class Point {
    x: number
    y: number

    constructor(options: { x: number; y: number }) {
        this.x = options.x
        this.y = options.y
    }

    transform(matrix: Matrix): Point {
        const { a, b, c, d, e, f } = matrix
        return new Point({
            x: this.x * a + this.y * c + e,
            y: this.x * b + this.y * d + f,
        })
    }

    static fromArray(arr: [number, number]): Point {
        return new Point({ x: arr[0], y: arr[1] })
    }
}
