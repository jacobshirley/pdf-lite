export class Matrix {
    a: number
    b: number
    c: number
    d: number
    e: number
    f: number

    constructor(options: {
        a: number
        b: number
        c: number
        d: number
        e: number
        f: number
    }) {
        this.a = options.a
        this.b = options.b
        this.c = options.c
        this.d = options.d
        this.e = options.e
        this.f = options.f
    }

    multiply(other: Matrix): Matrix {
        return new Matrix({
            a: this.a * other.a + this.c * other.b,
            b: this.b * other.a + this.d * other.b,
            c: this.a * other.c + this.c * other.d,
            d: this.b * other.c + this.d * other.d,
            e: this.a * other.e + this.c * other.f + this.e,
            f: this.b * other.e + this.d * other.f + this.f,
        })
    }

    translate(tx: number, ty: number): Matrix {
        return this.multiply(
            new Matrix({
                a: 1,
                b: 0,
                c: 0,
                d: 1,
                e: tx,
                f: ty,
            }),
        )
    }

    isIdentity(): boolean {
        return (
            this.a === 1 &&
            this.b === 0 &&
            this.c === 0 &&
            this.d === 1 &&
            this.e === 0 &&
            this.f === 0
        )
    }

    static identity(): Matrix {
        return new Matrix({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0,
        })
    }

    static fromArray(arr: number[]): Matrix {
        return new Matrix({
            a: arr[0],
            b: arr[1],
            c: arr[2],
            d: arr[3],
            e: arr[4],
            f: arr[5],
        })
    }
}
