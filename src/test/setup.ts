import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

/**
 * Global test setup.
 *
 * Every test starts from a clean DOM, empty storage and no leftover fetch
 * stubs, so ordering can never make one test depend on another.
 */

// jsdom implements neither of these, and several components call them.
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      // Desktop by default: `useIsDesktop()` drives a different layout, and
      // the desktop one shows every panel at once. Tests that need the mobile
      // arrangement stub matchMedia themselves.
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )

  // jsdom does not implement scrollIntoView; the conversation thread calls it
  // on every new message.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn()
  }

  // Recharts measures its container; jsdom reports zero, which renders nothing.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
