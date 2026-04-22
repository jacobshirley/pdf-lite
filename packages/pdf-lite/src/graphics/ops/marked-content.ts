import { ByteArray } from '../../types'
import { ContentOp } from './base'

export class MarkedContentOp extends ContentOp {}

/** `BMC` — begin marked-content sequence with a name tag. */
export class BeginMarkedContentOp extends MarkedContentOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(tag: string): BeginMarkedContentOp {
        return new BeginMarkedContentOp(`/${tag} BMC`)
    }

    get tag(): string {
        if (!this.raw) return ''
        return this.nameOperand(0)
    }

    set tag(v: string) {
        this.raw = `/${v} BMC`
    }
}

/**
 * `BDC` — begin marked-content sequence with a name tag plus a property
 * list (either an inline dictionary or a name referring to an entry in
 * the page's `/Properties` resource dict).  The properties payload is
 * preserved verbatim so round-trip is byte-safe.
 */
export class BeginMarkedContentPropsOp extends MarkedContentOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(tag: string, properties: string): BeginMarkedContentPropsOp {
        return new BeginMarkedContentPropsOp(`/${tag} ${properties} BDC`)
    }

    get tag(): string {
        if (!this.raw) return ''
        return this.nameOperand(0)
    }
}

/** `EMC` — end marked-content sequence. */
export class EndMarkedContentOp extends MarkedContentOp {
    constructor(input: string | ByteArray = 'EMC') {
        super(input)
    }
}

/** `MP` — marked-content point with a name tag (no begin/end pair). */
export class MarkedPointOp extends MarkedContentOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(tag: string): MarkedPointOp {
        return new MarkedPointOp(`/${tag} MP`)
    }

    get tag(): string {
        if (!this.raw) return ''
        return this.nameOperand(0)
    }

    set tag(v: string) {
        this.raw = `/${v} MP`
    }
}

/** `DP` — marked-content point with a name tag plus property list. */
export class MarkedPointPropsOp extends MarkedContentOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(tag: string, properties: string): MarkedPointPropsOp {
        return new MarkedPointPropsOp(`/${tag} ${properties} DP`)
    }

    get tag(): string {
        if (!this.raw) return ''
        return this.nameOperand(0)
    }
}
