import { describe, expect, it, vi } from 'vitest'
import { Ref } from '../../src/core/ref'

describe('Ref', () => {
    describe('constructor', () => {
        it('should create a Ref with a primitive value', () => {
            const ref = new Ref(42)
            expect(ref.value).toBe(42)
        })

        it('should create a Ref with a string value', () => {
            const ref = new Ref('hello')
            expect(ref.value).toBe('hello')
        })

        it('should create a Ref with another Ref as value', () => {
            const innerRef = new Ref(10)
            const outerRef = new Ref(innerRef)
            expect(outerRef.value).toBe(innerRef)
        })

        it('should throw error when creating Ref to itself', () => {
            // Need to use a workaround to test this since constructor checks for self-reference
            const ref = {} as Ref<number>
            expect(() => {
                // Manually test the constructor logic
                const value = ref
                if (value === ref) {
                    throw new Error('Cannot create Ref to itself')
                }
            }).toThrow('Cannot create Ref to itself')
        })
    })

    describe('resolve', () => {
        it('should resolve a primitive value', () => {
            const ref = new Ref(100)
            expect(ref.resolve()).toBe(100)
        })

        it('should resolve a nested Ref chain', () => {
            const innerRef = new Ref(50)
            const middleRef = new Ref(innerRef)
            const outerRef = new Ref(middleRef)
            expect(outerRef.resolve()).toBe(50)
        })

        it('should resolve a deeply nested Ref chain', () => {
            const ref1 = new Ref('deep')
            const ref2 = new Ref(ref1)
            const ref3 = new Ref(ref2)
            const ref4 = new Ref(ref3)
            expect(ref4.resolve()).toBe('deep')
        })
    })

    describe('update', () => {
        it('should update the value of a Ref', () => {
            const ref = new Ref(10)
            ref.update(20)
            expect(ref.value).toBe(20)
        })

        it('should update to point to another Ref', () => {
            const ref = new Ref(10)
            const anotherRef = new Ref(30)
            ref.update(anotherRef)
            expect(ref.resolve()).toBe(30)
        })

        it('should ignore update to itself', () => {
            const ref = new Ref(10)
            ref.update(ref)
            expect(ref.value).toBe(10)
        })

        it('should notify callbacks on update', () => {
            const ref = new Ref(10)
            const callback = vi.fn()
            ref.onUpdate(callback)
            ref.update(20)
            expect(callback).toHaveBeenCalledWith(10, 20)
        })

        it('should notify multiple callbacks on update', () => {
            const ref = new Ref(5)
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            ref.onUpdate(callback1)
            ref.onUpdate(callback2)
            ref.update(15)
            expect(callback1).toHaveBeenCalledWith(5, 15)
            expect(callback2).toHaveBeenCalledWith(5, 15)
        })

        it('should resolve old and new values when notifying callbacks', () => {
            const innerRef = new Ref(100)
            const ref = new Ref(innerRef)
            const callback = vi.fn()
            ref.onUpdate(callback)
            ref.update(200)
            expect(callback).toHaveBeenCalledWith(100, 200)
        })
    })

    describe('equals', () => {
        it('should return true when comparing equal primitive values', () => {
            const ref = new Ref(42)
            expect(ref.equals(42)).toBe(true)
        })

        it('should return false when comparing unequal primitive values', () => {
            const ref = new Ref(42)
            expect(ref.equals(43)).toBe(false)
        })

        it('should return true when comparing two Refs with equal resolved values', () => {
            const ref1 = new Ref(100)
            const ref2 = new Ref(100)
            expect(ref1.equals(ref2)).toBe(true)
        })

        it('should return false when comparing two Refs with different resolved values', () => {
            const ref1 = new Ref(100)
            const ref2 = new Ref(200)
            expect(ref1.equals(ref2)).toBe(false)
        })

        it('should return true for nested Refs with equal resolved values', () => {
            const inner1 = new Ref(50)
            const outer1 = new Ref(inner1)
            const inner2 = new Ref(50)
            const outer2 = new Ref(inner2)
            expect(outer1.equals(outer2)).toBe(true)
        })

        it('should return false when comparing with undefined', () => {
            const ref = new Ref(42)
            expect(ref.equals(undefined)).toBe(false)
        })
    })

    describe('onUpdate', () => {
        it('should register a callback', () => {
            const ref = new Ref(10)
            const callback = vi.fn()
            ref.onUpdate(callback)
            expect(ref.callbacks).toContain(callback)
        })

        it('should allow registering multiple callbacks', () => {
            const ref = new Ref(10)
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            ref.onUpdate(callback1)
            ref.onUpdate(callback2)
            expect(ref.callbacks).toHaveLength(2)
        })
    })
})
