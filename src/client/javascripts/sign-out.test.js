import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'

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
  get length() {
    return Object.keys(this.store).length
  }
}

// Mock location
const mockLocation = {
  href: ''
}

// Mock document for Node.js environment
const mockDocument = {
  getElementById: vi.fn(),
  addEventListener: vi.fn(),
  readyState: 'complete'
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
})

Object.defineProperty(globalThis, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true
})

Object.defineProperty(globalThis, 'document', {
  value: mockDocument,
  writable: true,
  configurable: true
})

describe('#sign-out', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    localStorageMock.clear()
    mockLocation.href = ''
    mockDocument.readyState = 'complete'
    mockDocument.getElementById.mockClear()
    mockDocument.addEventListener.mockClear()

    // Set up some test data in localStorage
    localStorageMock.setItem('test-key-1', 'value1')
    localStorageMock.setItem('test-key-2', 'value2')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should clear localStorage and redirect when logout URL is present', async () => {
    const mockLogoutUrl = 'https://example.com/logout'
    const mockElement = {
      dataset: {
        logoutUrl: mockLogoutUrl
      }
    }

    mockDocument.getElementById.mockReturnValue(mockElement)

    // Import and execute
    await import('./sign-out.js')

    expect(mockDocument.getElementById).toHaveBeenCalledWith('sign-out-data')
    expect(localStorageMock.length).toBe(0)
    expect(mockLocation.href).toBe(mockLogoutUrl)
  })

  test('Should not redirect when logout URL is missing', async () => {
    const mockElement = {
      dataset: {}
    }

    mockDocument.getElementById.mockReturnValue(mockElement)

    await import('./sign-out.js')

    expect(localStorageMock.length).toBe(0)
    expect(mockLocation.href).toBe('')
  })

  test('Should not error when sign-out-data element does not exist', async () => {
    mockDocument.getElementById.mockReturnValue(null)

    await import('./sign-out.js')

    expect(localStorageMock.length).toBe(0)
    expect(mockLocation.href).toBe('')
  })

  test('Should handle localStorage.clear errors gracefully', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const originalClear = localStorageMock.clear.bind(localStorageMock)
    localStorageMock.clear = vi.fn(() => {
      throw new Error('Storage error')
    })

    const mockLogoutUrl = 'https://example.com/logout'
    const mockElement = {
      dataset: {
        logoutUrl: mockLogoutUrl
      }
    }

    mockDocument.getElementById.mockReturnValue(mockElement)

    await import('./sign-out.js')

    expect(mockLocation.href).toBe(mockLogoutUrl)

    localStorageMock.clear = originalClear
    consoleWarnSpy.mockRestore()
  })

  test('Should setup via DOMContentLoaded when document is loading', async () => {
    mockDocument.readyState = 'loading'

    let domContentLoadedHandler = null
    mockDocument.addEventListener.mockImplementation((event, handler) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedHandler = handler
      }
    })

    const mockLogoutUrl = 'https://example.com/logout'
    const mockElement = {
      dataset: {
        logoutUrl: mockLogoutUrl
      }
    }

    mockDocument.getElementById.mockReturnValue(mockElement)

    await import('./sign-out.js')

    // Verify DOMContentLoaded listener was added
    expect(mockDocument.addEventListener).toHaveBeenCalledWith(
      'DOMContentLoaded',
      expect.any(Function)
    )

    // Verify it hasn't executed yet
    expect(mockDocument.getElementById).not.toHaveBeenCalled()

    // Simulate DOMContentLoaded event
    domContentLoadedHandler()

    // Now it should have executed
    expect(mockDocument.getElementById).toHaveBeenCalledWith('sign-out-data')
    expect(localStorageMock.length).toBe(0)
    expect(mockLocation.href).toBe(mockLogoutUrl)

    // Reset readyState for other tests
    mockDocument.readyState = 'complete'
  })
})
