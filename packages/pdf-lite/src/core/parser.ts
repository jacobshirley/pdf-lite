export abstract class Parser<I, O> {
    abstract feed(...input: I[]): void
    abstract nextItems(): Generator<O>
}
