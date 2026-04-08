import { ContentOp } from './base'

export class StrokeOp extends ContentOp {
    constructor() {
        super('S')
    }
}

export class CloseAndStrokeOp extends ContentOp {
    constructor() {
        super('s')
    }
}

export class FillOp extends ContentOp {
    constructor() {
        super('f')
    }
}

export class FillAlternateOp extends ContentOp {
    constructor() {
        super('F')
    }
}

export class FillEvenOddOp extends ContentOp {
    constructor() {
        super('f*')
    }
}

export class FillAndStrokeOp extends ContentOp {
    constructor() {
        super('B')
    }
}

export class CloseFillAndStrokeOp extends ContentOp {
    constructor() {
        super('b')
    }
}

export class FillAndStrokeEvenOddOp extends ContentOp {
    constructor() {
        super('B*')
    }
}

export class CloseFillAndStrokeEvenOddOp extends ContentOp {
    constructor() {
        super('b*')
    }
}

export class EndPathOp extends ContentOp {
    constructor() {
        super('n')
    }
}

export class ClipOp extends ContentOp {
    constructor() {
        super('W')
    }
}

export class ClipEvenOddOp extends ContentOp {
    constructor() {
        super('W*')
    }
}
