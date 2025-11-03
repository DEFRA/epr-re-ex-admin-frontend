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
  isReadOnlySchema: vi.fn(() => false),
  checkReadOnlyChanges: vi.fn(),
  highlightChanges: vi.fn(),
  LocalStorageManager: vi.fn(),
  getAutocompleteOptions: vi.fn(() => []),
  filterContextMenu: vi.fn((items) => items)
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
    'jsoneditor-save-button': {
      addEventListener: vi.fn()
    },
    'jsoneditor-form': {
      submit: vi.fn()
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
        expect(mockHelpers.highlightChanges).toHaveBeenCalled()
      })
    })

    describe('onEditable handler', () => {
      beforeEach(() => {
        mockHelpers.findSchemaNode.mockReturnValue({ type: 'string' })
        mockHelpers.isReadOnlySchema.mockReturnValue(false)
      })

      it('should return true for root nodes with no path', () => {
        expect(options.onEditable(null)).toBe(true)
        expect(options.onEditable({})).toBe(true)
        expect(options.onEditable({ path: 'not-array' })).toBe(true)
      })

      it('should return false when schema node is null', () => {
        mockHelpers.findSchemaNode.mockReturnValue(null)

        const result = options.onEditable({ path: ['name'] })
        expect(result).toBe(false)
      })

      it('should return false for read-only schema', () => {
        mockHelpers.isReadOnlySchema.mockReturnValue(true)

        const result = options.onEditable({ path: ['name'] })
        expect(result).toBe(false)
      })

      it('should return field:false, value:true for object types', () => {
        const result = options.onEditable({ path: ['name'], type: 'object' })
        expect(result).toEqual({ field: false, value: true })
      })

      it('should return field:false, value:true when node has field property', () => {
        const result = options.onEditable({ path: ['name'], field: 'name' })
        expect(result).toEqual({ field: false, value: true })
      })

      it('should return true for other cases', () => {
        const result = options.onEditable({ path: ['name'], type: 'string' })
        expect(result).toBe(true)
      })
    })

    describe('onValidate handler', () => {
      beforeEach(() => {
        mockHelpers.getValueAtPath.mockImplementation((obj, path) => {
          if (path.length === 0) return obj
          return obj?.[path[0]]
        })
        mockHelpers.deepEqual.mockImplementation(
          (a, b) => JSON.stringify(a) === JSON.stringify(b)
        )
      })

      it('should return empty errors for valid JSON', () => {
        mockValidate.mockReturnValue(true)
        mockValidate.errors = []

        const result = options.onValidate({ name: 'John' })
        expect(result).toEqual([])
      })

      it('should return AJV validation errors', () => {
        mockValidate.mockReturnValue(false)
        mockValidate.errors = [
          {
            instancePath: '/name',
            message: 'Invalid value'
          }
        ]

        const result = options.onValidate({ name: 'InvalidName' })

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
          path: ['name'],
          message: 'Invalid value'
        })
      })

      it('should customize enum error messages', () => {
        mockValidate.mockReturnValue(false)
        mockValidate.errors = [
          {
            instancePath: '/name',
            keyword: 'enum',
            params: { allowedValues: ['John', 'Jane'] }
          }
        ]

        const result = options.onValidate({ name: 'InvalidName' })

        expect(result[0].message).toBe('must be one of: "John", "Jane"')
      })

      it('should handle errors without instancePath', () => {
        mockValidate.mockReturnValue(false)
        mockValidate.errors = [
          {
            message: 'Root error'
          }
        ]

        const result = options.onValidate({ name: 'test' })

        expect(result[0].path).toEqual([])
      })

      it('should filter errors to only show changed fields', () => {
        mockValidate.mockReturnValue(false)
        mockValidate.errors = [
          { instancePath: '/name', message: 'Error 1' },
          { instancePath: '/age', message: 'Error 2' }
        ]

        // Mock deepEqual to show name changed but age didn't
        mockHelpers.deepEqual.mockImplementation((a, b) => {
          if (a === 'Jane' && b === 'John') return false // name changed
          if (a === 25 && b === 25) return true // age same
          return false
        })

        const result = options.onValidate({ name: 'Jane', age: 25 })

        expect(result).toHaveLength(1)
        expect(result[0].message).toBe('Error 1')
      })
    })

    describe('onCreateMenu handler', () => {
      it('should filter context menu items', () => {
        const mockItems = [
          { text: 'Copy' },
          { text: 'Duplicate' },
          { text: 'Remove' }
        ]

        const result = options.onCreateMenu(mockItems)

        expect(mockHelpers.filterContextMenu).toHaveBeenCalledWith(mockItems, [
          'Duplicate',
          'duplicate'
        ])
        expect(result).toBe(mockItems)
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

    describe('Save button', () => {
      it('should setup save button event listener', () => {
        expect(
          mockElements['jsoneditor-save-button'].addEventListener
        ).toHaveBeenCalledWith('click', expect.any(Function))
      })

      it('should submit form with JSON data', () => {
        const saveHandler =
          mockElements['jsoneditor-save-button'].addEventListener.mock
            .calls[0][1]
        const testData = { name: 'Jane', age: 30 }
        editorInstances[0].get = () => testData

        saveHandler()

        expect(mockElements['jsoneditor-organisation-object'].value).toBe(
          JSON.stringify(testData)
        )
        expect(mockElements['jsoneditor-form'].submit).toHaveBeenCalled()
      })

      it('should show alert when form is not found', () => {
        document.getElementById.mockImplementation((id) => {
          if (id === 'jsoneditor-form') return null
          return mockElements[id] || null
        })

        const saveHandler =
          mockElements['jsoneditor-save-button'].addEventListener.mock
            .calls[0][1]

        saveHandler()

        expect(window.alert).toHaveBeenCalledWith(
          'Form element not found for submission.'
        )
      })

      it('should handle errors and show alert', () => {
        const saveHandler =
          mockElements['jsoneditor-save-button'].addEventListener.mock
            .calls[0][1]
        editorInstances[0].get = () => {
          throw new Error('Test error')
        }

        saveHandler()

        expect(console.error).toHaveBeenCalledWith(
          'Failed to save data:',
          expect.any(Error)
        )
        expect(window.alert).toHaveBeenCalledWith(
          'Failed to save data. See console for details.'
        )
      })
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

      await import('./jsoneditor.js?t=8')

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialise JSONEditor:',
        expect.any(Error)
      )
    })
  })
})
