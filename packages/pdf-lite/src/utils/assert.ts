export function assert(value: unknown, message?: string): asserts value {
    if (!value) {
        throw new Error(message)
    }
}

export function assertIfDefined(
    value: unknown,
    condition: unknown,
    message?: string,
): asserts condition {
    if (value === undefined || value === null) {
        return
    }
    assert(condition, message)
}
