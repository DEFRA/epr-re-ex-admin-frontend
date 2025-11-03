import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest'

// Setup DOM environment before any imports
let mockStorageManager

class MockLocalStorage {
  constructor() {
    this.store = {}
  }

  getItem(key) {
    return this.store[key] || null
  }

  setItem(key, value) {
    this.store[key] = value
  }

  removeItem(key) {
    delete this.store[key]
  }

  clear() {
    this.store = {}
  }
}

// Mock window and document globally
const mockLocalStorage = new MockLocalStorage()

Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: mockLocalStorage,
    confirm: vi.fn()
  },
  writable: true,
  configurable: true
})

Object.defineProperty(globalThis, 'document', {
  value: {
    getElementById: vi.fn(),
    createElement: (tag) => ({
      id: null,
      type: null,
      textContent: null,
      value: null,
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })
  },
  writable: true,
  configurable: true
})

// Mock JSONEditor
const mockSet = vi.fn()
const mockGet = vi.fn()
const mockNode = {
  findNodeByPath: vi.fn()
}

let editorInstance = null
let editorOptions = null

const MockJSONEditorConstructor = vi.fn(function (container, options) {
  this.container = container
  this.options = options
  this.node = mockNode
  editorInstance = this
  editorOptions = options
})

MockJSONEditorConstructor.prototype.set = function (data) {
  mockSet(data)
}

MockJSONEditorConstructor.prototype.get = function () {
  return mockGet()
}

vi.mock('jsoneditor', () => ({
  default: MockJSONEditorConstructor
}))

vi.mock('jsoneditor/dist/jsoneditor.css', () => ({}))

// Mock the schema and validation
const mockValidate = vi.fn()
const mockSchema = {
  type: 'object',
  properties: {
    id: { not: {} },
    status: {
      type: 'string',
      enum: ['created', 'approved', 'rejected']
    },
    name: { type: 'string' }
  }
}

vi.mock('#server/common/schemas/organisation.ajv.js', () => ({
  default: mockValidate
}))

vi.mock('#server/common/schemas/organisation.json', () => ({
  default: mockSchema
}))

// Mock helper functions
const mockIsNodeEditable = vi.fn()
const mockHighlightChanges = vi.fn()
const mockGetAutocompleteOptions = vi.fn()
const mockValidateJSON = vi.fn()

// Shared mock methods for LocalStorageManager
const mockSave = vi.fn().mockReturnValue(true)
const mockLoad = vi.fn().mockReturnValue(null)
const mockClear = vi.fn().mockReturnValue(true)

class MockLocalStorageManager {
  constructor(key) {
    this.key = key
    mockStorageManager = this
  }

  save = mockSave
  load = mockLoad
  clear = mockClear
}

vi.mock('./jsoneditor.helpers.js', () => ({
  isNodeEditable: mockIsNodeEditable,
  highlightChanges: mockHighlightChanges,
  LocalStorageManager: MockLocalStorageManager,
  getAutocompleteOptions: mockGetAutocompleteOptions,
  validateJSON: mockValidateJSON
}))

// Mock console methods
const originalConsole = {
  info: console.info,
  error: console.error
}

describe('jsoneditor', () => {
  let container
  let payloadEl
  let hiddenInput
  let resetButton
  let messageEl
  let resetButtonListeners

  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue({ name: 'test' })
    mockIsNodeEditable.mockReturnValue(true)
    mockValidateJSON.mockReturnValue([])
    mockGetAutocompleteOptions.mockReturnValue([])
    
    // Reset localStorage
    mockLocalStorage.clear()
    
    // Reset storage manager mocks
    mockSave.mockClear()
    mockLoad.mockClear()
    mockClear.mockClear()
    mockLoad.mockReturnValue(null)
    mockSave.mockReturnValue(true)
    mockClear.mockReturnValue(true)

    resetButtonListeners = []

    // Setup DOM elements
    container = {
      id: 'jsoneditor'
    }

    payloadEl = {
      id: 'organisation-json',
      type: 'application/json',
      textContent: JSON.stringify({ id: 1, name: 'Original' })
    }

    hiddenInput = {
      id: 'jsoneditor-organisation-object',
      type: 'hidden',
      value: null
    }

    resetButton = {
      id: 'jsoneditor-reset-button',
      addEventListener: vi.fn((event, handler) => {
        resetButtonListeners.push({ event, handler })
      })
    }

    messageEl = null

    // Mock document methods
    document.getElementById = vi.fn((id) => {
      if (id === 'jsoneditor') return container
      if (id === 'organisation-json') return payloadEl
      if (id === 'jsoneditor-organisation-object') return hiddenInput
      if (id === 'jsoneditor-reset-button') return resetButton
      if (id === 'organisation-success-message') return messageEl
      return null
    })

    // Mock window.confirm
    window.confirm.mockClear()

    // Mock console
    console.info = vi.fn()
    console.error = vi.fn()
  })

  afterEach(() => {
    console.info = originalConsole.info
    console.error = originalConsole.error
    vi.resetModules()
  })

  describe('When jsoneditor container exists', () => {
    test('Should initialize JSONEditor with correct configuration', async () => {
      await import('./jsoneditor.js?t=1')

      expect(MockJSONEditorConstructor).toHaveBeenCalled()
      const [[containerArg, optionsArg]] = MockJSONEditorConstructor.mock.calls

      expect(containerArg).toBe(container)
      expect(optionsArg.mode).toBe('tree')
      expect(optionsArg.modes).toEqual(['text', 'tree', 'preview'])
      expect(typeof optionsArg.autocomplete.getOptions).toBe('function')
      expect(typeof optionsArg.onCreateMenu).toBe('function')
      expect(typeof optionsArg.onEvent).toBe('function')
      expect(typeof optionsArg.onExpand).toBe('function')
      expect(typeof optionsArg.onChangeJSON).toBe('function')
      expect(typeof optionsArg.onEditable).toBe('function')
      expect(typeof optionsArg.onValidate).toBe('function')
    })

    test('Should load original data when no draft exists', async () => {
      mockStorageManager.load.mockReturnValue(null)

      await import('./jsoneditor.js?t=2')

      expect(mockSet).toHaveBeenCalledWith({ id: 1, name: 'Original' })
    })

    test('Should load draft data from localStorage when available', async () => {
      const draftData = { id: 1, name: 'Draft' }
      mockLoad.mockReturnValue(draftData)

      await import('./jsoneditor.js?t=3')

      expect(mockSet).toHaveBeenCalledWith(draftData)
      expect(console.info).toHaveBeenCalledWith(
        '[JSONEditor] Loaded draft from localStorage'
      )
    })

    test('Should clear localStorage when success message is present', async () => {
      messageEl = {
        id: 'organisation-success-message'
      }
      mockClear.mockReturnValue(true)

      await import('./jsoneditor.js?t=4')

      expect(mockClear).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalledWith(
        '[JSONEditor] Cleared draft from localStorage after save'
      )
    })

    test('Should sync hidden input with initial data', async () => {
      await import('./jsoneditor.js?t=5')

      expect(hiddenInput.value).toBe(
        JSON.stringify({ id: 1, name: 'Original' })
      )
    })

    test('Should highlight changes with initial data', async () => {
      await import('./jsoneditor.js?t=6')

      expect(mockHighlightChanges).toHaveBeenCalled()
    })
  })

  describe('JSONEditor options', () => {
    beforeEach(async () => {
      await import('./jsoneditor.js?t=7')
    })

    describe('autocomplete.getOptions', () => {
      test('Should call getAutocompleteOptions with schema and path', () => {
        mockGetAutocompleteOptions.mockReturnValue(['option1', 'option2'])

        const result = editorOptions.autocomplete.getOptions('text', [
          'status'
        ])

        expect(mockGetAutocompleteOptions).toHaveBeenCalledWith(mockSchema, [
          'status'
        ])
        expect(result).toEqual(['option1', 'option2'])
      })
    })

    describe('onCreateMenu', () => {
      test('Should remove Duplicate items from menu', () => {
        const items = [
          { text: 'Append', action: 'append' },
          { text: 'Duplicate', action: 'duplicate' },
          { text: 'Insert', action: 'insert' },
          { text: 'duplicate', action: 'duplicate' }
        ]

        const result = editorOptions.onCreateMenu(items)

        expect(result).toHaveLength(2)
        expect(result[0].text).toBe('Append')
        expect(result[1].text).toBe('Insert')
      })
    })

    describe('onEvent', () => {
      test('Should save to localStorage and sync hidden input on blur event', () => {
        const node = { path: ['name'] }
        const event = { type: 'blur' }
        const currentData = { id: 1, name: 'Updated' }

        mockGet.mockReturnValue(currentData)

        editorOptions.onEvent(node, event)

        expect(mockSave).toHaveBeenCalledWith(currentData)
        expect(hiddenInput.value).toBe(JSON.stringify(currentData))
        expect(mockHighlightChanges).toHaveBeenCalled()
      })

      test('Should save to localStorage and sync hidden input on change event', () => {
        const node = { path: ['name'] }
        const event = { type: 'change' }
        const currentData = { id: 1, name: 'Changed' }

        mockGet.mockReturnValue(currentData)

        editorOptions.onEvent(node, event)

        expect(mockSave).toHaveBeenCalledWith(currentData)
        expect(hiddenInput.value).toBe(JSON.stringify(currentData))
        expect(mockHighlightChanges).toHaveBeenCalled()
      })

      test('Should not save on other event types', () => {
        const node = { path: ['name'] }
        const event = { type: 'click' }

        mockSave.mockClear()
        editorOptions.onEvent(node, event)

        expect(mockSave).not.toHaveBeenCalled()
      })
    })

    describe('onExpand', () => {
      test('Should highlight changes when node is expanded', () => {
        const currentData = { id: 1, name: 'Expanded' }
        mockGet.mockReturnValue(currentData)

        editorOptions.onExpand()

        expect(mockHighlightChanges).toHaveBeenCalledWith(
          expect.any(Object),
          currentData,
          { id: 1, name: 'Original' }
        )
      })
    })

    describe('onChangeJSON', () => {
      test('Should save to localStorage and sync hidden input', () => {
        const updatedJSON = { id: 1, name: 'Updated JSON' }

        editorOptions.onChangeJSON(updatedJSON)

        expect(mockSave).toHaveBeenCalledWith(updatedJSON)
        expect(hiddenInput.value).toBe(JSON.stringify(updatedJSON))
        expect(mockHighlightChanges).toHaveBeenCalledWith(
          expect.any(Object),
          updatedJSON,
          { id: 1, name: 'Original' }
        )
      })
    })

    describe('onEditable', () => {
      test('Should call isNodeEditable with node and schema', () => {
        const node = { path: ['name'], type: 'string' }
        mockIsNodeEditable.mockReturnValue(true)

        const result = editorOptions.onEditable(node)

        expect(mockIsNodeEditable).toHaveBeenCalledWith(node, mockSchema)
        expect(result).toBe(true)
      })

      test('Should return false when isNodeEditable returns false', () => {
        const node = { path: ['id'], type: 'number' }
        mockIsNodeEditable.mockReturnValue(false)

        const result = editorOptions.onEditable(node)

        expect(result).toBe(false)
      })
    })

    describe('onValidate', () => {
      test('Should call validateJSON with correct parameters', () => {
        const json = { id: 1, name: 'Test', status: 'created' }
        const errors = [
          { path: ['status'], message: 'must be one of: approved' }
        ]
        mockValidateJSON.mockReturnValue(errors)

        const result = editorOptions.onValidate(json)

        expect(mockValidateJSON).toHaveBeenCalledWith(
          json,
          { id: 1, name: 'Original' },
          mockSchema,
          mockValidate
        )
        expect(result).toEqual(errors)
      })
    })
  })

  describe('Reset button', () => {
    test('Should reset editor when confirmed', async () => {
      await import('./jsoneditor.js?t=8')
      
      window.confirm.mockReturnValue(true)

      // Find and trigger the click handler
      const clickHandler = resetButtonListeners.find(l => l.event === 'click')
      expect(clickHandler).toBeDefined()
      
      mockSet.mockClear()
      clickHandler.handler()

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to reset all changes?'
      )
      expect(mockClear).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalledWith({ id: 1, name: 'Original' })
      expect(hiddenInput.value).toBe(
        JSON.stringify({ id: 1, name: 'Original' })
      )
      expect(mockHighlightChanges).toHaveBeenCalledWith(
        expect.any(Object),
        { id: 1, name: 'Original' },
        { id: 1, name: 'Original' }
      )
    })

    test('Should not reset editor when cancelled', async () => {
      await import('./jsoneditor.js?t=9')
      
      window.confirm.mockReturnValue(false)

      // Find and trigger the click handler
      const clickHandler = resetButtonListeners.find(l => l.event === 'click')
      expect(clickHandler).toBeDefined()
      
      mockSet.mockClear()
      clickHandler.handler()

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to reset all changes?'
      )
      expect(mockClear).not.toHaveBeenCalled()
      expect(mockSet).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    test('Should handle errors when initializing JSONEditor', async () => {
      // Mock JSON.parse to throw an error
      const originalParse = JSON.parse
      JSON.parse = vi.fn(() => {
        throw new Error('Parse failed')
      })

      await import('./jsoneditor.js?t=10')

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialise JSONEditor:',
        expect.any(Error)
      )
      
      // Restore JSON.parse
      JSON.parse = originalParse
    })

    test('Should handle missing payload element gracefully', async () => {
      document.getElementById = vi.fn((id) => {
        if (id === 'jsoneditor') return container
        if (id === 'organisation-json') return null
        if (id === 'jsoneditor-organisation-object') return hiddenInput
        if (id === 'jsoneditor-reset-button') return resetButton
        return null
      })

      await import('./jsoneditor.js?t=11')

      // Should initialize with empty object as fallback
      expect(mockSet).toHaveBeenCalledWith({})
    })

    test('Should handle invalid JSON in payload element', async () => {
      payloadEl.textContent = 'invalid json{'

      await import('./jsoneditor.js?t=12')

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialise JSONEditor:',
        expect.any(Error)
      )
    })

    test('Should handle empty textContent in payload element', async () => {
      payloadEl.textContent = ''

      await import('./jsoneditor.js?t=14')

      // Should parse '{}' as fallback
      expect(mockSet).toHaveBeenCalledWith({})
    })

    test('Should handle missing hidden input element', async () => {
      document.getElementById = vi.fn((id) => {
        if (id === 'jsoneditor') return container
        if (id === 'organisation-json') return payloadEl
        if (id === 'jsoneditor-organisation-object') return null
        if (id === 'jsoneditor-reset-button') return resetButton
        return null
      })

      await import('./jsoneditor.js?t=15')

      // Should not throw error when hidden input is null
      expect(MockJSONEditorConstructor).toHaveBeenCalled()
    })

    test('Should handle clear returning false', async () => {
      messageEl = {
        id: 'organisation-success-message'
      }
      mockClear.mockReturnValue(false)

      await import('./jsoneditor.js?t=16')

      expect(mockClear).toHaveBeenCalled()
      // Should not log info message when clear fails
      expect(console.info).not.toHaveBeenCalledWith(
        '[JSONEditor] Cleared draft from localStorage after save'
      )
    })
  })

  describe('When jsoneditor container does not exist', () => {
    test('Should not initialize JSONEditor', async () => {
      document.getElementById = vi.fn(() => null)
      
      const initialCallCount = MockJSONEditorConstructor.mock.calls.length

      await import('./jsoneditor.js?t=13')

      // Verify no new instances were created
      expect(MockJSONEditorConstructor.mock.calls.length).toBe(initialCallCount)
    })
  })
})
