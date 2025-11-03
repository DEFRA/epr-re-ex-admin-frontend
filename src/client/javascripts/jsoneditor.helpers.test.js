import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  deepEqual,
  findSchemaNode,
  getValueAtPath,
  isReadOnlySchema,
  checkReadOnlyChanges,
  highlightChanges,
  LocalStorageManager,
  getAutocompleteOptions,
  filterContextMenu
} from './jsoneditor.helpers.js'

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
    localStorage: localStorageMock
  },
  writable: true
})

describe('JSONEditor Helpers', () => {
  describe('deepEqual', () => {
    it('should return true for identical primitive values', () => {
      expect(deepEqual(1, 1)).toBe(true)
      expect(deepEqual('test', 'test')).toBe(true)
      expect(deepEqual(true, true)).toBe(true)
      expect(deepEqual(null, null)).toBe(true)
      expect(deepEqual(undefined, undefined)).toBe(true)
    })

    it('should return false for different primitive values', () => {
      expect(deepEqual(1, 2)).toBe(false)
      expect(deepEqual('test', 'other')).toBe(false)
      expect(deepEqual(true, false)).toBe(false)
      expect(deepEqual(null, undefined)).toBe(false)
    })

    it('should return true for deeply equal objects', () => {
      const obj1 = { a: 1, b: { c: 2, d: [3, 4] } }
      const obj2 = { a: 1, b: { c: 2, d: [3, 4] } }
      expect(deepEqual(obj1, obj2)).toBe(true)
    })

    it('should return false for objects with different values', () => {
      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { a: 1, b: { c: 3 } }
      expect(deepEqual(obj1, obj2)).toBe(false)
    })

    it('should return false for objects with different keys', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, c: 2 }
      expect(deepEqual(obj1, obj2)).toBe(false)
    })

    it('should handle arrays correctly', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
    })

    it('should return false when comparing array to object', () => {
      expect(deepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false)
    })

    it('should handle nested structures', () => {
      const complex1 = {
        users: [
          { id: 1, name: 'John', meta: { active: true } },
          { id: 2, name: 'Jane', meta: { active: false } }
        ]
      }
      const complex2 = {
        users: [
          { id: 1, name: 'John', meta: { active: true } },
          { id: 2, name: 'Jane', meta: { active: false } }
        ]
      }
      expect(deepEqual(complex1, complex2)).toBe(true)
    })

    it('should return false for different types', () => {
      expect(deepEqual('string', 123)).toBe(false)
      expect(deepEqual({ a: 1 }, 'string')).toBe(false)
      expect(deepEqual([1, 2], 'array')).toBe(false)
      expect(deepEqual(null, { a: 1 })).toBe(false)
    })
  })

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

    it('should return null when traversing through null schema node', () => {
      // Create a path that will hit a null node during traversal
      const brokenSchema = {
        type: 'object',
        properties: {
          broken: null // This will cause node to be null during traversal
        }
      }
      expect(findSchemaNode(brokenSchema, ['broken', 'next'])).toBe(null)
    })

    it('should return null when node becomes null during path traversal', () => {
      // Schema where setting node = node.properties[segment] results in null
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

    it('should handle node becoming null during iteration', () => {
      // Create a schema where node.items is null, causing node to become null
      const schema = {
        type: 'array',
        items: null // This will make node null
      }
      // Path with multiple segments - first one succeeds, second triggers !node check
      expect(findSchemaNode(schema, ['0', '1'])).toBe(null)
    })

    it('should return null when node becomes null mid-traversal', () => {
      // Create a more complex scenario where node becomes null during path traversal
      const schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                deep: null // This property is null
              }
            }
          }
        }
      }
      // This path will make node null when reaching 'deep' property
      expect(findSchemaNode(schema, ['level1', '0', 'deep', 'further'])).toBe(
        null
      )
    })

    it('should handle null node assignment during traversal', () => {
      // Create a schema where node.properties[segment] is explicitly null
      const schema = {
        type: 'object',
        properties: {
          validProp: { type: 'string' }
        }
      }
      // Manually simulate the case where properties[segment] could be null
      schema.properties.nullProp = null

      // This should return null when trying to traverse beyond the null property
      expect(findSchemaNode(schema, ['nullProp', 'anything'])).toBe(null)
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

  describe('isReadOnlySchema', () => {
    it('should return true for explicit readOnly flag', () => {
      expect(isReadOnlySchema({ type: 'string', readOnly: true })).toBe(true)
    })

    it('should return true for empty not constraint', () => {
      expect(isReadOnlySchema({ type: 'string', not: {} })).toBe(true)
    })

    it('should return true for not.const constraint', () => {
      expect(
        isReadOnlySchema({ type: 'string', not: { const: 'value' } })
      ).toBe(true)
    })

    it('should return true for not.type constraint', () => {
      expect(
        isReadOnlySchema({ type: 'string', not: { type: 'number' } })
      ).toBe(true)
    })

    it('should return false for regular schema', () => {
      expect(isReadOnlySchema({ type: 'string' })).toBe(false)
    })

    it('should handle invalid inputs', () => {
      expect(isReadOnlySchema(null)).toBe(false)
      expect(isReadOnlySchema(undefined)).toBe(false)
      expect(isReadOnlySchema('string')).toBe(false)
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

  describe('filterContextMenu', () => {
    const menuItems = [
      { text: 'Cut', action: 'cut' },
      { text: 'Copy', action: 'copy' },
      { text: 'Paste', action: 'paste' },
      { text: 'Duplicate', action: 'duplicate' },
      { text: 'Remove', action: 'remove' }
    ]

    it('should filter out default excluded items', () => {
      const filtered = filterContextMenu(menuItems)
      expect(filtered).toHaveLength(4)
      expect(filtered.find((item) => item.text === 'Duplicate')).toBeUndefined()
    })

    it('should filter out custom excluded items', () => {
      const filtered = filterContextMenu(menuItems, ['Copy', 'Paste'])
      expect(filtered).toHaveLength(3)
      expect(filtered.map((item) => item.text)).toEqual([
        'Cut',
        'Duplicate',
        'Remove'
      ])
    })

    it('should filter by action as well as text', () => {
      const filtered = filterContextMenu(menuItems, ['duplicate'])
      expect(filtered).toHaveLength(4)
      expect(
        filtered.find((item) => item.action === 'duplicate')
      ).toBeUndefined()
    })

    it('should return all items when no exclusions match', () => {
      const filtered = filterContextMenu(menuItems, ['NonExistent'])
      expect(filtered).toHaveLength(5)
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

    it('should try different DOM element selectors when value element is not available', () => {
      const mockFieldElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      }

      const mockTrElement = {
        querySelector: vi.fn().mockReturnValue(mockFieldElement)
      }

      // Create a mock node with different DOM structure
      const mockNodeWithTr = {
        dom: {
          value: null, // No value element
          field: null, // No field element
          tr: mockTrElement // Has tr element with querySelector
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

    it('should handle DOM elements without proper structure', () => {
      // Create a mock node with minimal DOM structure
      const mockNodeMinimal = {
        dom: {
          value: null,
          field: null,
          tr: null
        }
      }

      mockEditor.node.findNodeByPath.mockReturnValue(mockNodeMinimal)

      const original = { name: 'John' }
      const current = { name: 'Jane' }

      // Should not throw when DOM elements are missing
      expect(() => {
        highlightChanges(mockEditor, current, original, [])
      }).not.toThrow()
    })

    it('should handle null/undefined current and original values', () => {
      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      // Test with null current and object original
      highlightChanges(mockEditor, null, { name: 'John' }, [])
      expect(mockNode.dom.value.classList.add).toHaveBeenCalledWith(
        'jsoneditor-changed'
      )

      mockNode.dom.value.classList.add.mockClear()

      // Test with object current and null original
      highlightChanges(mockEditor, { name: 'John' }, null, [])
      expect(mockNode.dom.value.classList.add).toHaveBeenCalledWith(
        'jsoneditor-changed'
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

    it('should handle when no DOM element is found', () => {
      // Create a node that returns null for all DOM selectors
      const nodeWithNoDom = {
        dom: {
          value: null,
          field: null,
          tr: {
            querySelector: vi.fn(() => null) // Returns null for both selectors
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

      // Verify no classList operations were attempted
      expect(nodeWithNoDom.dom.tr.querySelector).toHaveBeenCalledWith(
        '.jsoneditor-value'
      )
      expect(nodeWithNoDom.dom.tr.querySelector).toHaveBeenCalledWith(
        '.jsoneditor-field'
      )
    })

    it('should handle non-array current/original in array length calculation', () => {
      // Test when current is not an array but original is
      const original = ['a', 'b', 'c']
      const current = 'not-an-array' // Not an array

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should handle the ternary operator correctly
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledWith([])

      mockEditor.node.findNodeByPath.mockClear()

      // Test when original is not an array but current is
      const original2 = 'not-an-array'
      const current2 = ['a', 'b', 'c']

      highlightChanges(mockEditor, current2, original2, [])

      // Should handle the ternary operator correctly
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledWith([])
    })

    it('should handle null/undefined values in array processing', () => {
      // Test case where current is null but we're processing as arrays
      const original = ['item1']
      const current = null

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should handle current ? current[i] : undefined
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledTimes(2) // root + 1 element

      mockEditor.node.findNodeByPath.mockClear()

      // Test case where original is null but current is an array
      const original2 = null
      const current2 = ['item1']

      highlightChanges(mockEditor, current2, original2, [])

      // Should handle original ? original[i] : undefined
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledTimes(2) // root + 1 element
    })

    it('should handle null values in object key processing', () => {
      // Test where current is null but original is an object
      const original = { key1: 'value1' }
      const current = null

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // When current is null, it goes to root comparison, not object processing
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledWith([])

      mockEditor.node.findNodeByPath.mockClear()

      // Test where both are objects but one has null properties
      const original2 = { key1: 'value1' }
      const current2 = { key1: null }

      highlightChanges(mockEditor, current2, original2, [])

      // Should process as objects and handle the null values
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledTimes(2) // root + key1
    })

    it('should handle object processing with null fallback cases', () => {
      // Force the condition to enter object processing but with null values
      // This tests the Object.keys(current || {}) and Object.keys(original || {}) paths
      const current = {} // Empty object to trigger object processing
      const original = null // Null to test the || {} fallback

      mockEditor.node.findNodeByPath.mockReturnValue(mockNode)

      highlightChanges(mockEditor, current, original, [])

      // Should handle Object.keys(original || {}) fallback
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledWith([])

      mockEditor.node.findNodeByPath.mockClear()

      // Test the reverse case
      const current2 = null // Null to test the || {} fallback
      const original2 = {} // Empty object

      highlightChanges(mockEditor, current2, original2, [])

      // This case doesn't enter object processing because current is null
      expect(mockEditor.node.findNodeByPath).toHaveBeenCalledWith([])
    })
  })
})
