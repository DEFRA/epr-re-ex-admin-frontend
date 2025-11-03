import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Store JSONEditor instances and calls for testing
const editorInstances = []
const editorConstructorCalls = []

// Mock JSONEditor class
class MockJSONEditor {
  constructor(container, options) {
    this.container = container
    this.options = options
    this.data = {}
    this.node = {
      findNodeByPath: vi.fn()
    }

    editorInstances.push(this)
    editorConstructorCalls.push({ container, options })
  }

  set(data) {
    this.data = data
  }

  get() {
    return this.data
  }
}

// Mock dependencies
vi.mock('jsoneditor', () => ({
  default: MockJSONEditor
}))

vi.mock('jsoneditor/dist/jsoneditor.css', () => ({}))

// Mock validation function
const mockValidate = vi.fn(() => true)
mockValidate.errors = []

vi.mock('#server/common/schemas/organisation.ajv.js', () => ({
  default: mockValidate
}))

vi.mock('#server/common/schemas/organisation.json', () => ({
  default: {
    type: 'object',
    properties: {
      name: { type: 'string', enum: ['John', 'Jane'] },
      age: { type: 'number' }
    }
  }
}))

// Mock helper functions
const mockHelpers = {
  deepEqual: vi.fn(),
  findSchemaNode: vi.fn(),
  getValueAtPath: vi.fn(),
  isNodeEditable: vi.fn(() => true),
  checkReadOnlyChanges: vi.fn(),
  highlightChanges: vi.fn(),
  LocalStorageManager: vi.fn(),
  getAutocompleteOptions: vi.fn(() => []),
  validateJSON: vi.fn(() => [])
}

// Mock LocalStorageManager instance
const mockStorageInstance = {
  load: vi.fn(() => null),
  save: vi.fn(() => true),
  clear: vi.fn(() => true)
}

mockHelpers.LocalStorageManager.mockImplementation(() => mockStorageInstance)

vi.mock('./jsoneditor.helpers.js', () => mockHelpers)

// Mock DOM elements and global objects
const setupGlobalMocks = () => {
  const mockElements = {
    jsoneditor: {
      id: 'jsoneditor',
      addEventListener: vi.fn()
    },
    'organisation-json': {
      textContent: '{"name": "test", "age": 25}'
    },
    'organisation-success-message': null,
    'jsoneditor-reset-button': {
      addEventListener: vi.fn()
    },
    'jsoneditor-organisation-object': {
      value: ''
    }
  }

  Object.defineProperty(globalThis, 'document', {
    value: {
      getElementById: vi.fn((id) => mockElements[id] || null)
    },
    writable: true
  })

  Object.defineProperty(globalThis, 'window', {
    value: {
      confirm: vi.fn(() => true),
      alert: vi.fn()
    },
    writable: true
  })

  Object.defineProperty(globalThis, 'console', {
    value: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    },
    writable: true
  })

  return mockElements
}

describe('JSONEditor Main Module', () => {
  let mockElements

  beforeEach(() => {
    mockElements = setupGlobalMocks()
    vi.clearAllMocks()
    editorInstances.length = 0
    editorConstructorCalls.length = 0
    mockValidate.mockReturnValue(true)
    mockValidate.errors = []
    mockStorageInstance.load.mockReturnValue(null)
    mockHelpers.deepEqual.mockReturnValue(false)
    mockHelpers.getValueAtPath.mockReturnValue(undefined)
    mockHelpers.findSchemaNode.mockReturnValue({})
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('When container is not present', () => {
    it('should not initialize JSONEditor when container is missing', async () => {
      // Override getElementById to return null for jsoneditor
      document.getElementById.mockImplementation((id) => {
        if (id === 'jsoneditor') return null
        return mockElements[id] || null
      })

      await import('./jsoneditor.js?t=0')

      expect(editorConstructorCalls).toHaveLength(0)
    })
  })

  describe('When container is present', () => {
    it('should initialize JSONEditor with correct options', async () => {
      await import('./jsoneditor.js?t=1')

      expect(editorConstructorCalls).toHaveLength(1)
      const { container, options } = editorConstructorCalls[0]

      expect(container).toBe(mockElements['jsoneditor'])
      expect(options.mode).toBe('tree')
      expect(options.modes).toEqual(['text', 'tree', 'preview'])
      expect(typeof options.autocomplete.getOptions).toBe('function')
      expect(typeof options.onCreateMenu).toBe('function')
      expect(typeof options.onEvent).toBe('function')
      expect(typeof options.onExpand).toBe('function')
      expect(typeof options.onChangeJSON).toBe('function')
      expect(typeof options.onEditable).toBe('function')
      expect(typeof options.onValidate).toBe('function')
    })

    it('should clear localStorage when success message is present', async () => {
      mockElements['organisation-success-message'] = { id: 'success' }

      await import('./jsoneditor.js?t=2')

      expect(mockStorageInstance.clear).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalledWith(
        '[JSONEditor] Cleared draft from localStorage after save'
      )
    })

    it('should load saved draft when available', async () => {
      const savedData = { name: 'Jane', age: 30 }
      mockStorageInstance.load.mockReturnValue(savedData)

      await import('./jsoneditor.js?t=3')

      expect(mockStorageInstance.load).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalledWith(
        '[JSONEditor] Loaded draft from localStorage'
      )
      expect(editorInstances[0].data).toEqual(savedData)
    })

    it('should handle JSON parsing errors gracefully', async () => {
      mockElements['organisation-json'].textContent = 'invalid json'
      const initialEditorCount = editorInstances.length

      // Should not throw
      await expect(import('./jsoneditor.js?t=4')).resolves.toBeDefined()

      // JSON parse error is caught by the try-catch, so no new editor is created
      expect(editorInstances.length).toBe(initialEditorCount)
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle missing payload element', async () => {
      mockElements['organisation-json'] = null

      await import('./jsoneditor.js?t=5')

      expect(editorInstances[0].data).toEqual({})
    })

    it('should handle empty textContent with fallback to empty object', async () => {
      // Test the || '{}' fallback when textContent is empty
      mockElements['organisation-json'] = {
        textContent: '' // Empty string should trigger || '{}' fallback
      }

      await import('./jsoneditor.js?t=6')

      expect(editorInstances[0].data).toEqual({})
    })

    it('should handle null textContent with fallback to empty object', async () => {
      // Test the || '{}' fallback when textContent is null
      mockElements['organisation-json'] = {
        textContent: null // Null should trigger || '{}' fallback
      }

      await import('./jsoneditor.js?t=7')

      expect(editorInstances[0].data).toEqual({})
    })
  })

  describe('Event handlers functionality', () => {
    let options

    beforeEach(async () => {
      await import('./jsoneditor.js?t=6')
      options = editorConstructorCalls[0].options
    })

    describe('onEvent handler', () => {
      beforeEach(() => {
        vi.clearAllMocks()
      })

      it('should save to localStorage and highlight changes on blur event', () => {
        // The onEvent handler uses editor.get() from the closure, not this.get()
        // So we need to check what the actual editor instance returns
        const actualEditor = editorInstances[editorInstances.length - 1]
        const testData = { name: 'Jane' }
        actualEditor.set(testData)

        options.onEvent({ type: 'blur' }, { type: 'blur' })

        expect(mockStorageInstance.save).toHaveBeenCalledWith(testData)
        expect(mockElements['jsoneditor-organisation-object'].value).toBe(
          JSON.stringify(testData)
        )
        expect(mockHelpers.highlightChanges).toHaveBeenCalled()
      })

      it('should save to localStorage and highlight changes on change event', () => {
        // The onEvent handler uses editor.get() from the closure, not this.get()
        // So we need to check what the actual editor instance returns
        const actualEditor = editorInstances[editorInstances.length - 1]
        const testData = { name: 'Jane' }
        actualEditor.set(testData)

        options.onEvent({ type: 'change' }, { type: 'change' })

        expect(mockStorageInstance.save).toHaveBeenCalledWith(testData)
        expect(mockElements['jsoneditor-organisation-object'].value).toBe(
          JSON.stringify(testData)
        )
        expect(mockHelpers.highlightChanges).toHaveBeenCalled()
      })

      it('should ignore other event types', () => {
        const mockEditor = { get: () => ({}) }

        options.onEvent.call(mockEditor, { type: 'click' }, { type: 'click' })

        expect(mockStorageInstance.save).not.toHaveBeenCalled()
        expect(mockHelpers.highlightChanges).not.toHaveBeenCalled()
      })
    })

    describe('onExpand handler', () => {
      it('should highlight changes when expanded', () => {
        const testData = { name: 'Jane' }
        const mockEditor = { get: () => testData }

        options.onExpand.call(mockEditor)

        expect(mockHelpers.highlightChanges).toHaveBeenCalled()
      })
    })

    describe('onChangeJSON handler', () => {
      it('should save to localStorage and highlight changes', () => {
        const testData = { name: 'Jane' }

        options.onChangeJSON(testData)

        expect(mockStorageInstance.save).toHaveBeenCalledWith(testData)
        expect(mockElements['jsoneditor-organisation-object'].value).toBe(
          JSON.stringify(testData)
        )
        expect(mockHelpers.highlightChanges).toHaveBeenCalled()
      })
    })

    describe('onEditable handler', () => {
      beforeEach(() => {
        mockHelpers.isNodeEditable.mockReturnValue(true)
      })

      it('should call isNodeEditable with node and schema', () => {
        const node = { path: ['name'], type: 'string' }

        options.onEditable(node)

        expect(mockHelpers.isNodeEditable).toHaveBeenCalledWith(
          node,
          expect.objectContaining({
            type: 'object',
            properties: expect.any(Object)
          })
        )
      })

      it('should return true for editable nodes', () => {
        mockHelpers.isNodeEditable.mockReturnValue(true)

        const result = options.onEditable({ path: ['name'] })
        expect(result).toBe(true)
      })

      it('should return false for non-editable nodes', () => {
        mockHelpers.isNodeEditable.mockReturnValue(false)

        const result = options.onEditable({ path: ['id'] })
        expect(result).toBe(false)
      })

      it('should return { field: false, value: true } for object nodes', () => {
        mockHelpers.isNodeEditable.mockReturnValue({
          field: false,
          value: true
        })

        const result = options.onEditable({ path: ['address'], type: 'object' })
        expect(result).toEqual({ field: false, value: true })
      })
    })

    describe('onValidate handler', () => {
      beforeEach(() => {
        mockHelpers.validateJSON.mockReturnValue([])
      })

      it('should call validateJSON with correct parameters', () => {
        const json = { name: 'John' }

        options.onValidate(json)

        expect(mockHelpers.validateJSON).toHaveBeenCalledWith(
          json,
          { name: 'test', age: 25 }, // originalData
          expect.objectContaining({
            type: 'object',
            properties: expect.any(Object)
          }), // schema
          mockValidate // validate function
        )
      })

      it('should return empty errors for valid JSON', () => {
        mockHelpers.validateJSON.mockReturnValue([])

        const result = options.onValidate({ name: 'John' })

        expect(result).toEqual([])
      })

      it('should return validation errors from validateJSON', () => {
        const errors = [
          { path: ['name'], message: 'Invalid value' },
          { path: ['age'], message: 'Must be a number' }
        ]
        mockHelpers.validateJSON.mockReturnValue(errors)

        const result = options.onValidate({ name: 'InvalidName' })

        expect(result).toEqual(errors)
      })
    })

    describe('autocomplete getOptions', () => {
      it('should call getAutocompleteOptions helper', () => {
        const mockPath = ['name']
        mockHelpers.getAutocompleteOptions.mockReturnValue(['John', 'Jane'])

        const result = options.autocomplete.getOptions('J', mockPath)

        expect(mockHelpers.getAutocompleteOptions).toHaveBeenCalled()
        expect(result).toEqual(['John', 'Jane'])
      })
    })

    describe('onCreateMenu handler', () => {
      it('should filter out Duplicate menu item with text "Duplicate"', () => {
        const items = [
          { text: 'Append', action: 'append' },
          { text: 'Duplicate', action: 'duplicate' },
          { text: 'Remove', action: 'remove' }
        ]

        const result = options.onCreateMenu(items)

        expect(result).toHaveLength(2)
        expect(result).toEqual([
          { text: 'Append', action: 'append' },
          { text: 'Remove', action: 'remove' }
        ])
      })

      it('should filter out duplicate menu item with action "duplicate"', () => {
        const items = [
          { text: 'Append', action: 'append' },
          { text: 'Copy', action: 'duplicate' },
          { text: 'Remove', action: 'remove' }
        ]

        const result = options.onCreateMenu(items)

        expect(result).toHaveLength(2)
        expect(result).toEqual([
          { text: 'Append', action: 'append' },
          { text: 'Remove', action: 'remove' }
        ])
      })

      it('should keep all items when no Duplicate item exists', () => {
        const items = [
          { text: 'Append', action: 'append' },
          { text: 'Insert', action: 'insert' },
          { text: 'Remove', action: 'remove' }
        ]

        const result = options.onCreateMenu(items)

        expect(result).toHaveLength(3)
        expect(result).toEqual(items)
      })

      it('should handle empty items array', () => {
        const items = []

        const result = options.onCreateMenu(items)

        expect(result).toEqual([])
      })
    })
  })

  describe('Button event listeners', () => {
    beforeEach(async () => {
      await import('./jsoneditor.js?t=7')
    })

    describe('Reset button', () => {
      it('should setup reset button event listener', () => {
        expect(
          mockElements['jsoneditor-reset-button'].addEventListener
        ).toHaveBeenCalledWith('click', expect.any(Function))
      })

      it('should reset editor when confirmed', () => {
        const resetHandler =
          mockElements['jsoneditor-reset-button'].addEventListener.mock
            .calls[0][1]

        window.confirm.mockReturnValue(true)

        resetHandler()

        expect(window.confirm).toHaveBeenCalledWith(
          'Are you sure you want to reset all changes?'
        )
        expect(mockStorageInstance.clear).toHaveBeenCalled()
        expect(mockElements['jsoneditor-organisation-object'].value).toBe(
          JSON.stringify({ name: 'test', age: 25 })
        )
        expect(mockHelpers.highlightChanges).toHaveBeenCalled()
      })

      it('should not reset editor when cancelled', () => {
        const resetHandler =
          mockElements['jsoneditor-reset-button'].addEventListener.mock
            .calls[0][1]

        window.confirm.mockReturnValue(false)

        resetHandler()

        expect(mockStorageInstance.clear).not.toHaveBeenCalled()
      })
    })

    describe('Hidden input synchronization', () => {
      it('should sync hidden input with initial data', () => {
        // Check that hidden input was set with initial data
        expect(mockElements['jsoneditor-organisation-object'].value).toBe(
          JSON.stringify({ name: 'test', age: 25 })
        )
      })
    })
  })

  describe('Hidden input with saved draft', () => {
    let mockElements

    beforeEach(() => {
      mockElements = setupGlobalMocks()
      vi.clearAllMocks()
      editorInstances.length = 0
      editorConstructorCalls.length = 0
      mockValidate.mockReturnValue(true)
      mockValidate.errors = []

      // Set up saved data BEFORE import
      const savedData = { name: 'Jane', age: 30 }
      mockStorageInstance.load.mockReturnValue(savedData)

      mockHelpers.deepEqual.mockReturnValue(false)
      mockHelpers.getValueAtPath.mockReturnValue(undefined)
      mockHelpers.findSchemaNode.mockReturnValue({})
    })

    it('should sync hidden input when draft is loaded', async () => {
      await import('./jsoneditor.js?t=9')

      expect(mockElements['jsoneditor-organisation-object'].value).toBe(
        JSON.stringify({ name: 'Jane', age: 30 })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      vi.doMock('jsoneditor', () => ({
        default: class {
          constructor() {
            throw new Error('JSONEditor failed')
          }
        }
      }))

      await import('./jsoneditor.js?t=10')

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialise JSONEditor:',
        expect.any(Error)
      )
    })
  })
})
