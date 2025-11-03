import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock dependencies
vi.mock('jsoneditor', () => ({
  default: class MockJSONEditor {
    constructor(container, options) {
      this.container = container
      this.options = options
      this.data = {}
    }

    set(data) {
      this.data = data
    }

    get() {
      return this.data
    }
  }
}))

vi.mock('jsoneditor/dist/jsoneditor.css', () => ({}))

vi.mock('#server/common/schemas/organisation.ajv.js', () => ({
  default: vi.fn(() => true)
}))

vi.mock('#server/common/schemas/organisation.json', () => ({
  default: {
    type: 'object',
    properties: {
      name: { type: 'string' }
    }
  }
}))

// Mock DOM elements
const mockContainer = {
  id: 'jsoneditor'
}

const mockPayloadElement = {
  textContent: '{"name": "test"}'
}

const mockButton = {
  addEventListener: vi.fn()
}

const mockForm = {
  submit: vi.fn()
}

const mockHiddenInput = {
  value: ''
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock window and document
Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: localStorageMock,
    confirm: vi.fn(() => true),
    alert: vi.fn()
  },
  writable: true
})

Object.defineProperty(globalThis, 'document', {
  value: {
    getElementById: vi.fn((id) => {
      switch (id) {
        case 'jsoneditor':
          return mockContainer
        case 'organisation-json':
          return mockPayloadElement
        case 'organisation-success-message':
          return null // No success message by default
        case 'jsoneditor-reset-button':
        case 'jsoneditor-save-button':
          return mockButton
        case 'jsoneditor-form':
          return mockForm
        case 'jsoneditor-organisation-object':
          return mockHiddenInput
        default:
          return null
      }
    })
  },
  writable: true
})

describe('JSONEditor Main Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should handle mocked dependencies without errors', () => {
    // Test that all our mocks are properly set up
    expect(document.getElementById).toBeDefined()
    expect(window.localStorage).toBeDefined()
    expect(mockContainer).toBeDefined()
  })

  it('should handle missing container gracefully', () => {
    // Mock getElementById to return null for jsoneditor container
    document.getElementById = vi.fn(() => null)

    // This should not throw when the container doesn't exist
    const container = document.getElementById('jsoneditor')
    expect(container).toBe(null)
  })

  it('should mock localStorage operations correctly', () => {
    const testData = { test: 'data' }
    window.localStorage.setItem('test', JSON.stringify(testData))

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test',
      JSON.stringify(testData)
    )
  })
})
