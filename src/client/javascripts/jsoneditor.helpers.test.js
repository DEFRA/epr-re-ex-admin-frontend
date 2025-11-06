import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  findSchemaNode,
  getValueAtPath,
  isNodeEditable,
  checkReadOnlyChanges,
  highlightChanges,
  LocalStorageManager,
  getAutocompleteOptions,
  validateJSON,
  initJSONEditor
} from './jsoneditor.helpers.js'

// Use vi.hoisted to ensure these are available when mocks are set up
const { mockSet, mockGet, MockJSONEditorConstructor } = vi.hoisted(() => {
  const mockSet = vi.fn()
  const mockGet = vi.fn()
  const mockNode = {
    findNodeByPath: vi.fn()
  }

  const MockJSONEditorConstructor = vi.fn(function (container, options) {
    this.options = options
    this.node = mockNode
  })

  MockJSONEditorConstructor.prototype.set = function (data) {
    mockSet(data)
  }

  MockJSONEditorConstructor.prototype.get = function () {
    return mockGet()
  }

  return { mockSet, mockGet, mockNode, MockJSONEditorConstructor }
})

vi.mock('jsoneditor', () => ({
  default: MockJSONEditorConstructor
}))

vi.mock('jsoneditor/dist/jsoneditor.css', () => ({}))

// Mock localStorage for Node.js environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock window object for Node.js environment
Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: localStorageMock,
    confirm: vi.fn()
  },
  writable: true
})

// Also add localStorage and confirm directly to globalThis
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

Object.defineProperty(globalThis, 'confirm', {
  value: vi.fn(),
  writable: true
})

// Mock document for Node.js environment
Object.defineProperty(globalThis, 'document', {
  value: {
    getElementById: vi.fn()
  }
})

describe('JSONEditor Helpers', () => {
  describe('findSchemaNode', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' }
          }
        },
        tags: {
          type: 'array',
          items: { type: 'string', enum: ['urgent', 'normal', 'low'] }
        }
      }
    }

    it('should return root schema for empty path', () => {
      expect(findSchemaNode(schema, [])).toEqual(schema)
    })

    it('should find direct property', () => {
      const result = findSchemaNode(schema, ['name'])
      expect(result).toEqual({ type: 'string' })
    })

    it('should find nested object property', () => {
      const result = findSchemaNode(schema, ['address', 'street'])
      expect(result).toEqual({ type: 'string' })
    })

    it('should find array items schema', () => {
      const result = findSchemaNode(schema, ['tags', '0'])
      expect(result).toEqual({
        type: 'string',
        enum: ['urgent', 'normal', 'low']
      })
    })

    it('should return null for invalid path', () => {
      expect(findSchemaNode(schema, ['nonexistent'])).toBe(null)
      expect(findSchemaNode(schema, ['address', 'nonexistent'])).toBe(null)
    })

    it('should return null for invalid inputs', () => {
      expect(findSchemaNode(null, ['name'])).toBe(null)
      expect(findSchemaNode(schema, null)).toBe(null)
      expect(findSchemaNode(schema, 'not-array')).toBe(null)
    })

    it('should return null when node becomes null during path traversal', () => {
      // Schema where properties[segment] is null, causing node to become null mid-traversal
      const schema = {
        type: 'object',
        properties: {
          valid: { type: 'string' },
          nullProp: null
        }
      }
      // This will make node null on the second iteration
      expect(findSchemaNode(schema, ['nullProp', 'nonexistent'])).toBe(null)
    })
  })

  describe('getValueAtPath', () => {
    const testObj = {
      name: 'John',
      address: {
        street: '123 Main St',
        city: 'Boston'
      },
      tags: ['urgent', 'important']
    }

    it('should get value at simple path', () => {
      expect(getValueAtPath(testObj, ['name'])).toBe('John')
    })

    it('should get value at nested path', () => {
      expect(getValueAtPath(testObj, ['address', 'street'])).toBe('123 Main St')
    })

    it('should get array element', () => {
      expect(getValueAtPath(testObj, ['tags', '0'])).toBe('urgent')
    })

    it('should return undefined for invalid path', () => {
      expect(getValueAtPath(testObj, ['nonexistent'])).toBe(undefined)
      expect(getValueAtPath(testObj, ['address', 'nonexistent'])).toBe(
        undefined
      )
    })

    it('should handle invalid inputs', () => {
      expect(getValueAtPath(null, ['name'])).toBe(undefined)
      expect(getValueAtPath(testObj, null)).toBe(undefined)
      expect(getValueAtPath(testObj, [])).toEqual(testObj)
    })
  })

  describe('isNodeEditable', () => {
    const schema = {
      type: 'object',
      properties: {
        id: { type: 'string', readOnly: true },
        locked: { type: 'string', not: {} },
        constLocked: { type: 'string', not: { const: 'value' } },
        typeLocked: { type: 'string', not: { type: 'number' } },
        name: { type: 'string' },
        age: { type: 'number' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' }
          }
        }
      }
    }

    it('should return true for nodes without path', () => {
      expect(isNodeEditable(null, schema)).toBe(true)
      expect(isNodeEditable({}, schema)).toBe(true)
      expect(isNodeEditable({ path: 'not-array' }, schema)).toBe(true)
    })

    it('should return false when schema node is not found', () => {
      const node = { path: ['nonexistent'] }
      expect(isNodeEditable(node, schema)).toBe(false)
    })

    it('should return false for fields with explicit readOnly flag', () => {
      const node = { path: ['id'], type: 'string' }
      expect(isNodeEditable(node, schema)).toBe(false)
    })

    it('should return false for fields with empty not constraint', () => {
      const node = { path: ['locked'], type: 'string' }
      expect(isNodeEditable(node, schema)).toBe(false)
    })

    it('should return false for fields with not.const constraint', () => {
      const node = { path: ['constLocked'], type: 'string' }
      expect(isNodeEditable(node, schema)).toBe(false)
    })

    it('should return false for fields with not.type constraint', () => {
      const node = { path: ['typeLocked'], type: 'string' }
      expect(isNodeEditable(node, schema)).toBe(false)
    })

    it('should return { field: false, value: true } for object types', () => {
      const node = { path: ['address'], type: 'object' }
      expect(isNodeEditable(node, schema)).toEqual({
        field: false,
        value: true
      })
    })

    it('should return { field: false, value: true } when node has field property', () => {
      const node = { path: ['name'], field: 'name', type: 'string' }
      expect(isNodeEditable(node, schema)).toEqual({
        field: false,
        value: true
      })
    })

    it('should return true for editable fields', () => {
      const node = { path: ['name'], type: 'string' }
      expect(isNodeEditable(node, schema)).toBe(true)
    })

    it('should return true for editable number fields', () => {
      const node = { path: ['age'], type: 'number' }
      expect(isNodeEditable(node, schema)).toBe(true)
    })

    it('should handle nested paths correctly', () => {
      const node = { path: ['address', 'street'], type: 'string' }
      expect(isNodeEditable(node, schema)).toBe(true)
    })

    it('should handle read-only nested fields', () => {
      const nestedSchema = {
        type: 'object',
        properties: {
          config: {
            type: 'object',
            properties: {
              version: { type: 'string', readOnly: true }
            }
          }
        }
      }
      const node = { path: ['config', 'version'], type: 'string' }
      expect(isNodeEditable(node, nestedSchema)).toBe(false)
    })

    it('should handle object nodes with field property correctly', () => {
      // When node.field is truthy (e.g., a key name), it should lock the field
      const node = { path: ['address'], type: 'object', field: 'address' }
      expect(isNodeEditable(node, schema)).toEqual({
        field: false,
        value: true
      })
    })

    it('should handle when subschema is a non-object primitive value', () => {
      // Edge case: if schema node is somehow a primitive (shouldn't happen in valid schemas)
      // but we test defensive code
      const weirdSchema = {
        type: 'object',
        properties: {
          primitive: 'string' // Invalid schema, but tests the defensive check
        }
      }
      const node = { path: ['primitive'], type: 'string' }
      // Should skip the object type check and continue to field/value check
      expect(isNodeEditable(node, weirdSchema)).toBe(true)
    })

    it('should return true for fields with not constraint that has other properties', () => {
      // Test case where "not" exists but doesn't have const or type
      const schemaWithOtherNot = {
        type: 'object',
        properties: {
          otherNot: { type: 'string', not: { enum: ['foo', 'bar'] } }
        }
      }
      const node = { path: ['otherNot'], type: 'string' }
      expect(isNodeEditable(node, schemaWithOtherNot)).toBe(true)
    })
  })

  describe('checkReadOnlyChanges', () => {
    const schema = {
      type: 'object',
      properties: {
        id: { type: 'string', readOnly: true },
        name: { type: 'string' },
        config: {
          type: 'object',
          properties: {
            version: { type: 'string', readOnly: true },
            title: { type: 'string' }
          }
        }
      }
    }

    it('should detect changes to read-only fields', () => {
      const original = { id: '123', name: 'John' }
      const current = { id: '456', name: 'John' }
      const errors = []

      checkReadOnlyChanges(current, original, schema, [], errors)

      expect(errors).toHaveLength(1)
      expect(errors[0]).toEqual({
        path: ['id'],
        message: 'This read-only field cannot be changed.'
      })
    })

    it('should not error for unchanged read-only fields', () => {
      const original = { id: '123', name: 'John' }
      const current = { id: '123', name: 'Jane' }
      const errors = []

      checkReadOnlyChanges(current, original, schema, [], errors)

      expect(errors).toHaveLength(0)
    })

    it('should check nested read-only fields', () => {
      const original = { config: { version: '1.0', title: 'App' } }
      const current = { config: { version: '2.0', title: 'App' } }
      const errors = []

      checkReadOnlyChanges(current, original, schema, [], errors)

      expect(errors).toHaveLength(1)
      expect(errors[0].path).toEqual(['config', 'version'])
    })

    it('should handle arrays with read-only items', () => {
      const arraySchema = {
        type: 'array',
        items: { type: 'string', readOnly: true }
      }
      const original = ['item1', 'item2']
      const current = ['item1', 'changed']
      const errors = []

      checkReadOnlyChanges(current, original, arraySchema, [], errors)

      expect(errors).toHaveLength(1)
      expect(errors[0].path).toEqual([1])
    })

    it('should handle null/undefined schema gracefully', () => {
      const errors = []

      // Test with null schema
      checkReadOnlyChanges(
        { test: 'data' },
        { test: 'original' },
        null,
        [],
        errors
      )
      expect(errors).toHaveLength(0)

      // Test with undefined schema
      checkReadOnlyChanges(
        { test: 'data' },
        { test: 'original' },
        undefined,
        [],
        errors
      )
      expect(errors).toHaveLength(0)

      // Test with non-object schema
      checkReadOnlyChanges(
        { test: 'data' },
        { test: 'original' },
        'not-object',
        [],
        errors
      )
      expect(errors).toHaveLength(0)
    })

    it('should handle array data with non-array original', () => {
      const arraySchema = {
        type: 'array',
        items: { type: 'string', readOnly: true }
      }
      const current = ['item1', 'item2']
      const original = null // Not an array
      const errors = []

      checkReadOnlyChanges(current, original, arraySchema, [], errors)

      // Should check each item against undefined from original
      expect(errors).toHaveLength(2)
      expect(errors[0].path).toEqual([0])
      expect(errors[1].path).toEqual([1])
    })
  })

  describe('LocalStorageManager', () => {
    let manager
    const testKey = 'test-key'

    beforeEach(() => {
      manager = new LocalStorageManager(testKey)
      // Clear localStorage before each test
      vi.clearAllMocks()
    })

    it('should save and load data successfully', () => {
      const testData = { name: 'John', age: 30 }
      const serialized = JSON.stringify(testData)

      localStorageMock.getItem.mockReturnValue(serialized)

      expect(manager.save(testData)).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(testKey, serialized)

      const loaded = manager.load()
      expect(loaded).toEqual(testData)
      expect(localStorageMock.getItem).toHaveBeenCalledWith(testKey)
    })

    it('should return null when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)
      expect(manager.load()).toBe(null)
    })

    it('should clear data successfully', () => {
      expect(manager.clear()).toBe(true)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(testKey)
    })

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const result = manager.save({ data: 'test' })
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save to localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock localStorage to return invalid JSON
      localStorageMock.getItem.mockReturnValue('invalid-json{')

      const result = manager.load()
      expect(result).toBe(null)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load localStorage draft:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle clear errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock localStorage.removeItem to throw an error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      const result = manager.clear()
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear localStorage draft:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getAutocompleteOptions', () => {
    const schema = {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'pending']
        },
        priority: {
          type: 'number',
          enum: [1, 2, 3]
        },
        name: {
          type: 'string'
        }
      }
    }

    it('should return enum values as strings', () => {
      const options = getAutocompleteOptions(schema, ['status'])
      expect(options).toEqual(['active', 'inactive', 'pending'])
    })

    it('should convert number enums to strings', () => {
      const options = getAutocompleteOptions(schema, ['priority'])
      expect(options).toEqual(['1', '2', '3'])
    })

    it('should return empty array for non-enum fields', () => {
      const options = getAutocompleteOptions(schema, ['name'])
      expect(options).toEqual([])
    })

    it('should return empty array for invalid paths', () => {
      const options = getAutocompleteOptions(schema, ['nonexistent'])
      expect(options).toEqual([])
    })
  })

  describe('validateJSON', () => {
    const schema = {
      type: 'object',
      properties: {
        id: { type: 'string', readOnly: true },
        name: { type: 'string', enum: ['John', 'Jane'] },
        age: { type: 'number' }
      }
    }

    const mockValidate = vi.fn()

    beforeEach(() => {
      mockValidate.mockReset()
      mockValidate.errors = []
    })

    it('should return empty array for valid JSON', () => {
      mockValidate.mockReturnValue(true)
      mockValidate.errors = []

      const json = { id: '123', name: 'John', age: 30 }
      const original = { id: '123', name: 'John', age: 30 }

      const errors = validateJSON(json, original, schema, mockValidate)

      expect(errors).toEqual([])
      expect(mockValidate).toHaveBeenCalledWith(json)
    })

    it('should return AJV validation errors', () => {
      mockValidate.mockReturnValue(false)
      mockValidate.errors = [
        {
          instancePath: '/age',
          message: 'must be number'
        }
      ]

      const json = { id: '123', name: 'John', age: 'invalid' }
      const original = { id: '123', name: 'John', age: 30 }

      const errors = validateJSON(json, original, schema, mockValidate)

      expect(errors).toHaveLength(1)
      expect(errors[0]).toEqual({
        path: ['age'],
        message: 'must be number'
      })
    })

    it('should customize enum error messages', () => {
      mockValidate.mockReturnValue(false)
      mockValidate.errors = [
        {
          instancePath: '/name',
          keyword: 'enum',
          params: { allowedValues: ['John', 'Jane'] },
          message: 'must be equal to one of the allowed values'
        }
      ]

      const json = { id: '123', name: 'Bob', age: 30 }
      const original = { id: '123', name: 'John', age: 30 }

      const errors = validateJSON(json, original, schema, mockValidate)

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('must be one of: "John", "Jane"')
    })

    it('should handle errors without instancePath', () => {
      mockValidate.mockReturnValue(false)
      mockValidate.errors = [
        {
          message: 'Root level error'
        }
      ]

      const json = { id: '123', name: 'John', age: 30 }
      const original = { id: '123', name: 'Jane', age: 25 }

      const errors = validateJSON(json, original, schema, mockValidate)

      expect(errors[0].path).toEqual([])
    })

    it('should handle errors without message', () => {
      mockValidate.mockReturnValue(false)
      mockValidate.errors = [
        {
          instancePath: '/age'
        }
      ]

      const json = { id: '123', name: 'John', age: 'invalid' }
      const original = { id: '123', name: 'John', age: 30 }

      const errors = validateJSON(json, original, schema, mockValidate)

      expect(errors[0].message).toBe('Validation error')
    })

    it('should add readOnly change errors', () => {
      mockValidate.mockReturnValue(true)
      mockValidate.errors = []

      const json = { id: '456', name: 'John', age: 30 }
      const original = { id: '123', name: 'John', age: 30 }

      const errors = validateJSON(json, original, schema, mockValidate)

      expect(errors).toHaveLength(1)
      expect(errors[0].path).toEqual(['id'])
      expect(errors[0].message).toBe('This read-only field cannot be changed.')
    })

    it('should filter errors to only show changed fields', () => {
      mockValidate.mockReturnValue(false)
      mockValidate.errors = [
        {
          instancePath: '/name',
          message: 'Invalid name'
        },
        {
          instancePath: '/age',
          message: 'Invalid age'
        }
      ]

      // Only name changed, age is the same
      const json = { id: '123', name: 'Bob', age: 30 }
      const original = { id: '123', name: 'John', age: 30 }

      const errors = validateJSON(json, original, schema, mockValidate)

      // Should only show error for the changed field (name)
      expect(errors).toHaveLength(1)
      expect(errors[0].path).toEqual(['name'])
    })

    it('should handle URL-encoded paths correctly', () => {
      mockValidate.mockReturnValue(false)
      mockValidate.errors = [
        {
          instancePath: '/field%20with%20space',
          message: 'Error in encoded field'
        }
      ]

      const json = { 'field with space': 'invalid' }
      const original = { 'field with space': 'valid' }

      const errors = validateJSON(json, original, schema, mockValidate)

      expect(errors[0].path).toEqual(['field with space'])
    })

    it('should combine AJV errors and readOnly errors', () => {
      mockValidate.mockReturnValue(false)
      mockValidate.errors = [
        {
          instancePath: '/name',
          message: 'Invalid name'
        }
      ]

      const json = { id: '456', name: 'Bob', age: 30 }
      const original = { id: '123', name: 'John', age: 30 }

      const errors = validateJSON(json, original, schema, mockValidate)

      // Should have both errors (changed name and changed readonly id)
      expect(errors).toHaveLength(2)
      expect(errors.map((e) => e.path)).toEqual(
        expect.arrayContaining([['name'], ['id']])
      )
    })
  })

  describe('highlightChanges', () => {
    let mockEditor
    let mockNode
    let mockElement

    beforeEach(() => {
      mockElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      }

      mockNode = {
        dom: {
          value: mockElement
        }
      }

      mockEditor = {
        node: {
          findNodeByPath: vi.fn().mockReturnValue(mockNode)
        }
      }
    })

    it('should add changed class when values differ', () => {
      const original = { name: 'John' }
      const current = { name: 'Jane' }

      highlightChanges(mockEditor, current, original, [])

      expect(mockElement.classList.add).toHaveBeenCalledWith(
        'jsoneditor-changed'
      )
    })

    it('should remove changed class when values are same', () => {
      const original = { name: 'John' }
      const current = { name: 'John' }

      highlightChanges(mockEditor, current, original, [])

      expect(mockElement.classList.remove).toHaveBeenCalledWith(
        'jsoneditor-changed'
      )
    })

    it('should handle missing DOM elements gracefully', () => {
      mockEditor.node.findNodeByPath.mockReturnValue(null)

      const original = { name: 'John' }
      const current = { name: 'Jane' }

      // Should not throw an error
      expect(() => {
        highlightChanges(mockEditor, current, original, [])
      }).not.toThrow()
    })

    it('should recursively process object properties', () => {
      const original = { user: { name: 'John', age: 30 } }
      const current = { user: { name: 'Jane', age: 30 } }

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should be called for root, user object, user.name, and user.age
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledTimes(4)
    })

    it('should handle arrays correctly', () => {
      const original = ['a', 'b', 'c']
      const current = ['a', 'changed', 'c']

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should be called for root and each array element
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledTimes(4)
    })

    it('should handle undefined/null array elements when arrays have different lengths', () => {
      const original = ['a', 'b']
      const current = null // current is falsy

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should handle accessing undefined current[i] when current is null
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalled()
    })

    it('should handle when both array values are falsy', () => {
      const original = null
      const current = ['a', 'b']

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should handle accessing undefined original[i] when original is null
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalled()
    })

    it('should try different DOM element selectors when primary element is not available', () => {
      const mockFieldElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      }

      const mockTrElement = {
        querySelector: vi.fn().mockReturnValue(mockFieldElement)
      }

      // Create a mock node with tr element but no direct value/field elements
      const mockNodeWithTr = {
        dom: {
          value: null,
          field: null,
          tr: mockTrElement
        }
      }

      mockEditor.node.findNodeByPath.mockReturnValue(mockNodeWithTr)

      const original = { name: 'John' }
      const current = { name: 'Jane' }

      highlightChanges(mockEditor, current, original, [])

      expect(mockTrElement.querySelector).toHaveBeenCalledWith(
        '.jsoneditor-value'
      )
      expect(mockFieldElement.classList.add).toHaveBeenCalledWith(
        'jsoneditor-changed'
      )
    })

    it('should handle when no DOM element is found', () => {
      // Create a node that returns null for all DOM selectors
      const nodeWithNoDom = {
        dom: {
          value: null,
          field: null,
          tr: {
            querySelector: vi.fn(() => null)
          }
        }
      }

      mockEditor.node.findNodeByPath.mockReturnValue(nodeWithNoDom)

      const original = { name: 'John' }
      const current = { name: 'Jane' }

      // Should not throw when no DOM element is found
      expect(() => {
        highlightChanges(mockEditor, current, original, [])
      }).not.toThrow()

      expect(nodeWithNoDom.dom.tr.querySelector).toHaveBeenCalledWith(
        '.jsoneditor-value'
      )
    })

    it('should handle arrays with different lengths', () => {
      const original = ['a', 'b', 'c', 'd', 'e']
      const current = ['a', 'changed'] // Shorter array

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should be called for root plus max length (5) elements
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledTimes(6)
    })

    it('should handle objects with different key sets', () => {
      const original = { a: 1, b: 2, c: 3 }
      const current = { a: 1, d: 4 } // Different keys

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should be called for root plus unique keys (a, b, c, d) = 5 times
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledTimes(5)
    })

    it('should handle mismatched types between current and original', () => {
      // Test when one is an array and the other is not
      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      // Array vs non-array
      highlightChanges(mockEditor, ['a', 'b'], 'not-array', [])
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalled()

      mockEditor.node.findNodeByPath.mockClear()

      // Non-array vs array
      highlightChanges(mockEditor, 'not-array', ['a', 'b'], [])
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalled()
    })
  })

  describe('initJSONEditor', () => {
    let container
    let payloadEl
    let hiddenInput
    let resetButton
    let messageEl
    let resetButtonListeners
    let mockValidate
    let testSchema
    let originalGetElementById
    let originalConfirm
    let originalConsoleInfo
    let originalConsoleError

    beforeEach(() => {
      vi.clearAllMocks()

      // Reset mocks
      mockSet.mockClear()
      mockGet.mockClear()
      mockGet.mockReturnValue({ name: 'test' })
      MockJSONEditorConstructor.mockClear()
      resetButtonListeners = []

      // Setup test schema and validate function
      mockValidate = vi.fn()
      testSchema = {
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

      // Setup DOM elements
      container = { id: 'jsoneditor' }
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

      // Mock document.getElementById
      originalGetElementById = document.getElementById
      document.getElementById = vi.fn((id) => {
        if (id === 'jsoneditor') return container
        if (id === 'organisation-json') return payloadEl
        if (id === 'jsoneditor-organisation-object') return hiddenInput
        if (id === 'jsoneditor-reset-button') return resetButton
        if (id === 'organisation-success-message') return messageEl
        return null
      })

      // Mock window.confirm
      originalConfirm = globalThis.confirm
      globalThis.confirm = vi.fn()

      // Mock console
      originalConsoleInfo = console.info
      originalConsoleError = console.error
      console.info = vi.fn()
      console.error = vi.fn()

      // Clear localStorage
      localStorageMock.getItem.mockReturnValue(null)
      localStorageMock.setItem.mockClear()
      localStorageMock.setItem.mockImplementation(() => {}) // Reset to normal behavior
      localStorageMock.removeItem.mockClear()
      localStorageMock.removeItem.mockImplementation(() => {}) // Reset to normal behavior
    })

    afterEach(() => {
      document.getElementById = originalGetElementById
      globalThis.confirm = originalConfirm
      console.info = originalConsoleInfo
      console.error = originalConsoleError
    })

    it('should initialize JSONEditor with correct configuration', () => {
      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

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

    it('should load draft data from localStorage when available', () => {
      const draftData = { id: 1, name: 'Draft' }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(draftData))

      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      expect(mockSet).toHaveBeenCalledWith(draftData)
      expect(console.info).toHaveBeenCalledWith(
        '[JSONEditor] Loaded draft from localStorage'
      )
    })

    it('should clear localStorage when success message is present', () => {
      messageEl = { id: 'organisation-success-message' }

      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'test-storage-key'
      )
      expect(console.info).toHaveBeenCalledWith(
        '[JSONEditor] Cleared draft from localStorage after save'
      )
    })

    it('should sync hidden input with initial data', () => {
      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      expect(hiddenInput.value).toBe(
        JSON.stringify({ id: 1, name: 'Original' })
      )
    })

    it('should accept custom element IDs', () => {
      const customContainer = { id: 'custom-container' }
      const customPayload = {
        id: 'custom-payload',
        textContent: JSON.stringify({ name: 'Custom' })
      }
      const customInput = { id: 'custom-input', value: null }
      const customButton = {
        id: 'custom-button',
        addEventListener: vi.fn()
      }

      document.getElementById = vi.fn((id) => {
        if (id === 'custom-container') return customContainer
        if (id === 'custom-payload') return customPayload
        if (id === 'custom-input') return customInput
        if (id === 'custom-button') return customButton
        return null
      })

      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key',
        containerId: 'custom-container',
        payloadElementId: 'custom-payload',
        hiddenInputId: 'custom-input',
        resetButtonId: 'custom-button'
      })

      expect(MockJSONEditorConstructor).toHaveBeenCalled()
      const [[containerArg]] = MockJSONEditorConstructor.mock.calls
      expect(containerArg).toBe(customContainer)
      expect(customInput.value).toBe(JSON.stringify({ name: 'Custom' }))
    })

    it('should not initialize when container does not exist', () => {
      document.getElementById = vi.fn(() => null)

      const initialCallCount = MockJSONEditorConstructor.mock.calls.length

      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      expect(MockJSONEditorConstructor.mock.calls.length).toBe(initialCallCount)
    })

    it('should not initialize when payload element does not exist', () => {
      document.getElementById = vi.fn((id) => {
        if (id === 'jsoneditor') return container
        if (id === 'organisation-json') return null
        return null
      })

      const initialCallCount = MockJSONEditorConstructor.mock.calls.length

      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      expect(MockJSONEditorConstructor.mock.calls.length).toBe(initialCallCount)
      expect(console.error).toHaveBeenCalledWith('Payload element not found')
    })

    it('should handle errors gracefully', () => {
      payloadEl.textContent = 'invalid json{'

      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialise JSONEditor:',
        expect.any(Error)
      )
    })

    it('should handle missing hidden input', () => {
      document.getElementById = vi.fn((id) => {
        if (id === 'jsoneditor') return container
        if (id === 'organisation-json') return payloadEl
        if (id === 'jsoneditor-organisation-object') return null
        if (id === 'jsoneditor-reset-button') return resetButton
        return null
      })

      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      expect(MockJSONEditorConstructor).toHaveBeenCalled()
    })

    it('should handle clear failing', () => {
      messageEl = { id: 'organisation-success-message' }
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalledWith(
        '[JSONEditor] Cleared draft from localStorage after save'
      )

      consoleWarnSpy.mockRestore()
    })

    it('should reset editor when confirmed', () => {
      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      globalThis.confirm.mockReturnValue(true)

      const clickHandler = resetButtonListeners.find((l) => l.event === 'click')
      expect(clickHandler).toBeDefined()

      mockSet.mockClear()
      clickHandler.handler()

      expect(globalThis.confirm).toHaveBeenCalledWith(
        'Are you sure you want to reset all changes?'
      )
      expect(localStorageMock.removeItem).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalledWith({ id: 1, name: 'Original' })
    })

    it('should not reset editor when cancelled', () => {
      initJSONEditor({
        schema: testSchema,
        validate: mockValidate,
        storageKey: 'test-storage-key'
      })

      globalThis.confirm.mockReturnValue(false)

      const clickHandler = resetButtonListeners.find((l) => l.event === 'click')
      expect(clickHandler).toBeDefined()

      mockSet.mockClear()
      localStorageMock.removeItem.mockClear()
      clickHandler.handler()

      expect(globalThis.confirm).toHaveBeenCalledWith(
        'Are you sure you want to reset all changes?'
      )
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
      expect(mockSet).not.toHaveBeenCalled()
    })

    describe('Editor callbacks', () => {
      let editorOptions

      beforeEach(() => {
        initJSONEditor({
          schema: testSchema,
          validate: mockValidate,
          storageKey: 'test-storage-key'
        })
        editorOptions = MockJSONEditorConstructor.mock.calls[0][1]
      })

      it('should call callbacks via autocomplete.getOptions', () => {
        const result = editorOptions.autocomplete.getOptions('text', ['status'])
        expect(result).toEqual(['created', 'approved', 'rejected'])
      })

      it('should filter duplicate items via onCreateMenu', () => {
        const items = [
          { text: 'Insert', action: 'insert' },
          { text: 'Duplicate', action: 'duplicate' },
          { text: 'Remove', action: 'remove' }
        ]
        const result = editorOptions.onCreateMenu(items)
        expect(result).toHaveLength(2)
        expect(result.find((i) => i.text === 'Duplicate')).toBeUndefined()
      })

      it('should handle blur event via onEvent', () => {
        mockGet.mockReturnValue({ id: 1, name: 'Updated' })
        localStorageMock.setItem.mockClear()

        editorOptions.onEvent({}, { type: 'blur' })

        expect(localStorageMock.setItem).toHaveBeenCalled()
        expect(hiddenInput.value).toBe(
          JSON.stringify({ id: 1, name: 'Updated' })
        )
      })

      it('should handle change event via onEvent', () => {
        mockGet.mockReturnValue({ id: 1, name: 'Changed' })
        localStorageMock.setItem.mockClear()

        editorOptions.onEvent({}, { type: 'change' })

        expect(localStorageMock.setItem).toHaveBeenCalled()
      })

      it('should not save on other event types via onEvent', () => {
        localStorageMock.setItem.mockClear()

        editorOptions.onEvent({}, { type: 'click' })

        expect(localStorageMock.setItem).not.toHaveBeenCalled()
      })

      it('should highlight changes via onExpand', () => {
        mockGet.mockReturnValue({ id: 1, name: 'Expanded' })
        editorOptions.onExpand()
        // Just ensure it executes without error
        expect(mockGet).toHaveBeenCalled()
      })

      it('should save and sync via onChangeJSON', () => {
        localStorageMock.setItem.mockClear()
        const updatedData = { id: 1, name: 'NewData' }

        editorOptions.onChangeJSON(updatedData)

        expect(localStorageMock.setItem).toHaveBeenCalled()
        expect(hiddenInput.value).toBe(JSON.stringify(updatedData))
      })

      it('should check editability via onEditable', () => {
        const node = { path: ['name'], type: 'string' }
        const result = editorOptions.onEditable(node)
        expect(result).toBe(true)
      })

      it('should validate via onValidate', () => {
        mockValidate.mockReturnValue(true)
        mockValidate.errors = null
        const json = { id: 1, name: 'Test' }

        const errors = editorOptions.onValidate(json)

        expect(mockValidate).toHaveBeenCalledWith(json)
        expect(Array.isArray(errors)).toBe(true)
      })
    })
  })
})
