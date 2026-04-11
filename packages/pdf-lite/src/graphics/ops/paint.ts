import { ByteArray } from '../../types'
import { ContentOp } from './base'

export class PaintOp extends ContentOp {}

export class StrokeOp extends PaintOp {
    constructor(input: string | ByteArray = 'S') {
        super(input)
    }
}

export class CloseAndStrokeOp extends PaintOp {
    constructor(input: string | ByteArray = 's') {
        super(input)
    }
}

export class FillOp extends PaintOp {
    constructor(input: string | ByteArray = 'f') {
        super(input)
    }
}

export class FillAlternateOp extends PaintOp {
    constructor(input: string | ByteArray = 'F') {
        super(input)
    }
}

export class FillEvenOddOp extends PaintOp {
    constructor(input: string | ByteArray = 'f*') {
        super(input)
    }
}

export class FillAndStrokeOp extends PaintOp {
    constructor(input: string | ByteArray = 'B') {
        super(input)
    }
}

export class CloseFillAndStrokeOp extends PaintOp {
    constructor(input: string | ByteArray = 'b') {
        super(input)
    }
}

export class FillAndStrokeEvenOddOp extends PaintOp {
    constructor(input: string | ByteArray = 'B*') {
        super(input)
    }
}

export class CloseFillAndStrokeEvenOddOp extends PaintOp {
    constructor(input: string | ByteArray = 'b*') {
        super(input)
    }
}

export class EndPathOp extends PaintOp {
    constructor(input: string | ByteArray = 'n') {
        super(input)
    }
}

export class ClipOp extends PaintOp {
    constructor(input: string | ByteArray = 'W') {
        super(input)
    }
}

export class ClipEvenOddOp extends PaintOp {
    constructor(input: string | ByteArray = 'W*') {
        super(input)
    }
}
