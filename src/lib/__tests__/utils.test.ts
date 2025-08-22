import { cn, debounce, throttle } from '@/lib/utils'

describe('Utility Functions', () => {
    describe('cn', () => {
        it('should combine class names correctly', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2')
            expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
            expect(cn('class1', null, undefined, 'class2')).toBe('class1 class2')
        })

        it('should handle Tailwind CSS classes correctly', () => {
            expect(cn('px-4 py-2', 'px-4')).toBe('py-2 px-4')
            expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
        })
    })

    describe('debounce', () => {
        it('should debounce function calls', () => {
            jest.useFakeTimers()

            let callCount = 0
            const debouncedFn = debounce(() => {
                callCount++
            }, 100)

            // Call multiple times
            debouncedFn()
            debouncedFn()
            debouncedFn()

            expect(callCount).toBe(0)

            // Fast forward time
            jest.advanceTimersByTime(100)

            // Run all pending timers
            jest.runAllTimers()

            expect(callCount).toBe(1)

            jest.useRealTimers()
        })
    })

    describe('throttle', () => {
        it('should throttle function calls', (done) => {
            jest.useFakeTimers()

            let callCount = 0
            const throttledFn = throttle(() => {
                callCount++
            }, 100)

            // Call multiple times
            throttledFn()
            throttledFn()
            throttledFn()

            expect(callCount).toBe(1)

            // Fast forward time
            jest.advanceTimersByTime(100)

            throttledFn()
            expect(callCount).toBe(2)

            done()
            jest.useRealTimers()
        })
    })
})
