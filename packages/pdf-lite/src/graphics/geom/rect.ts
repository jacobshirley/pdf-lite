export class Rect {
    x: number
    y: number
    width: number
    height: number

    constructor(options: {
        x: number
        y: number
        width: number
        height: number
    }) {
        this.x = options.x
        this.y = options.y
        this.width = options.width
        this.height = options.height
    }

    static fromArray(arr: [number, number, number, number]): Rect {
        return new Rect({
            x: arr[0],
            y: arr[1],
            width: arr[2] - arr[0],
            height: arr[3] - arr[1],
        })
    }
}
