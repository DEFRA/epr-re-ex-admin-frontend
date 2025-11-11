import { describe, test, expect, beforeEach, vi } from 'vitest'

const mockCreateAll = vi.fn()

vi.mock('govuk-frontend', () => ({
  createAll: mockCreateAll,
  Button: 'MockButton',
  Checkboxes: 'MockCheckboxes',
  ErrorSummary: 'MockErrorSummary',
  Header: 'MockHeader',
  Radios: 'MockRadios',
  SkipLink: 'MockSkipLink'
}))

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = value.toString()
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  },
  key(index) {
    const keys = Object.keys(this.store).length
    return keys[index] || null
  },
  get length() {
    return Object.keys(this.store).length
  }
}

// Add localStorage to globalThis
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock document for Node.js environment
const mockDocument = {
  body: {
    innerHTML: ''
  },
  querySelector: vi.fn(),
  addEventListener: vi.fn(),
  readyState: 'complete'
}

Object.defineProperty(globalThis, 'document', {
  value: mockDocument,
  writable: true,
  configurable: true
})

describe('#application', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockDocument.body.innerHTML = ''
    mockDocument.querySelector.mockClear()
    mockDocument.addEventListener.mockClear()
  })

  describe('When module is loaded', () => {
    test('Should call createAll once for each component', async () => {
      // Need to reset modules to ensure fresh import
      vi.resetModules()
      await import('./application.js')

      expect(mockCreateAll).toHaveBeenCalledTimes(6)
      expect(mockCreateAll).toHaveBeenCalledWith('MockButton')
      expect(mockCreateAll).toHaveBeenCalledWith('MockCheckboxes')
      expect(mockCreateAll).toHaveBeenCalledWith('MockErrorSummary')
      expect(mockCreateAll).toHaveBeenCalledWith('MockHeader')
      expect(mockCreateAll).toHaveBeenCalledWith('MockRadios')
      expect(mockCreateAll).toHaveBeenCalledWith('MockSkipLink')
    })
  })

  describe('Sign out functionality', () => {
    beforeEach(() => {
      // Set up some test data in localStorage
      globalThis.localStorage.setItem(
        'organisation-jsoneditor-draft-123',
        '{"test": "data1"}'
      )
      globalThis.localStorage.setItem(
        'organisation-jsoneditor-draft-456',
        '{"test": "data2"}'
      )
      globalThis.localStorage.setItem('some-other-key', '{"test": "keep"}')
    })

    test('Should clear all localStorage when sign-out link is clicked', async () => {
      // Create mock sign-out link with event listener support
      let clickHandler = null
      const mockLink = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'click') {
            clickHandler = handler
          }
        })
      }

      mockDocument.querySelector.mockReturnValue(mockLink)

      // Reset and import module to set up handlers
      vi.resetModules()
      await import('./application.js')

      // Verify querySelector was called for sign-out link
      expect(mockDocument.querySelector).toHaveBeenCalledWith(
        'a[href="/auth/sign-out"]'
      )

      // Verify event listener was attached
      expect(mockLink.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )

      // Verify data exists before click
      expect(globalThis.localStorage.length).toBeGreaterThan(0)

      // Trigger click by calling the handler
      clickHandler()

      // Verify all localStorage is cleared
      expect(globalThis.localStorage.length).toBe(0)
      expect(
        globalThis.localStorage.getItem('organisation-jsoneditor-draft-123')
      ).toBeNull()
      expect(
        globalThis.localStorage.getItem('organisation-jsoneditor-draft-456')
      ).toBeNull()
      expect(globalThis.localStorage.getItem('some-other-key')).toBeNull()
    })

    test('Should not error if no sign-out link exists', async () => {
      mockDocument.querySelector.mockReturnValue(null)

      // Should not throw error
      vi.resetModules()
      await import('./application.js')

      // Should complete without errors
      expect(mockDocument.querySelector).toHaveBeenCalledWith(
        'a[href="/auth/sign-out"]'
      )
    })

    test('Should handle localStorage errors gracefully', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      // Mock localStorage.clear to throw error
      const originalClear = globalThis.localStorage.clear.bind(
        globalThis.localStorage
      )
      globalThis.localStorage.clear = vi.fn(() => {
        throw new Error('Storage error')
      })

      let clickHandler = null
      const mockLink = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'click') {
            clickHandler = handler
          }
        })
      }

      mockDocument.querySelector.mockReturnValue(mockLink)
      vi.resetModules()
      await import('./application.js')

      // Trigger click
      clickHandler()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to clear localStorage:',
        expect.any(Error)
      )

      // Restore
      globalThis.localStorage.clear = originalClear
      consoleWarnSpy.mockRestore()
    })

    test('Should setup handler via DOMContentLoaded when document is loading', async () => {
      // Set readyState to 'loading'
      mockDocument.readyState = 'loading'

      let domContentLoadedHandler = null
      mockDocument.addEventListener.mockImplementation((event, handler) => {
        if (event === 'DOMContentLoaded') {
          domContentLoadedHandler = handler
        }
      })

      let clickHandler = null
      const mockLink = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'click') {
            clickHandler = handler
          }
        })
      }

      mockDocument.querySelector.mockReturnValue(mockLink)

      vi.resetModules()
      await import('./application.js')

      // Verify DOMContentLoaded listener was added
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      )

      // Verify querySelector was not called yet (waiting for DOM)
      expect(mockDocument.querySelector).not.toHaveBeenCalled()

      // Simulate DOMContentLoaded event
      domContentLoadedHandler()

      // Now querySelector should have been called
      expect(mockDocument.querySelector).toHaveBeenCalledWith(
        'a[href="/auth/sign-out"]'
      )
      expect(mockLink.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )

      // Verify clearing works
      clickHandler()
      expect(globalThis.localStorage.length).toBe(0)

      // Reset readyState for other tests
      mockDocument.readyState = 'complete'
    })
  })
})
