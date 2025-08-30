import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'

// Mock theme context for tests
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    )
}

// Custom render function that includes providers
const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: MockThemeProvider, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Test data factories
export const createMockListing = (overrides = {}) => ({
    id: '1',
    title: 'Test Listing',
    description: 'Test description',
    priceSats: 100000,
    category: 'Electronics' as const,
    location: 'Toronto, ON',
    lat: 43.653,
    lng: -79.383,
    type: 'sell' as const,
    images: ['https://example.com/image.jpg'],
    boostedUntil: null,
    seller: {
        name: 'Test Seller',
        score: 100,
        deals: 50,
        thumbsUp: 10,
        verifications: {
            email: true,
            phone: false,
            lnurl: true,
        },
        onTimeRelease: 95,
    },
    createdAt: Date.now(),
    ...overrides,
})

export const createMockUser = (overrides = {}) => ({
    id: '1',
    email: 'test@example.com',
    handle: 'testuser',
    image: 'https://example.com/avatar.jpg',
    thumbsUp: 10,
    deals: 50,
    ...overrides,
})

export const createMockPlace = (overrides = {}) => ({
    name: 'Toronto, ON',
    lat: 43.653,
    lng: -79.383,
    ...overrides,
})

// Utility functions for tests
export const waitForElementToBeRemoved = (element: Element) =>
    new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            if (!document.contains(element)) {
                observer.disconnect()
                resolve(undefined)
            }
        })
        observer.observe(document.body, { childList: true, subtree: true })
    })

export const createMockIntersectionObserver = () => {
    const mockIntersectionObserver = () => ({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
    })
    window.IntersectionObserver = mockIntersectionObserver as any
    return mockIntersectionObserver
}

export const createMockResizeObserver = () => {
    const mockResizeObserver = () => ({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
    })
    window.ResizeObserver = mockResizeObserver as any
    return mockResizeObserver
}
