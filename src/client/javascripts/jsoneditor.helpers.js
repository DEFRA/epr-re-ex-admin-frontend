/**
 * Helper functions for JSONEditor functionality
 * Provides utilities for schema validation, data comparison, and UI highlighting
 */

/**
 * Performs deep equality comparison between two values
 * @param {*} a - First value to compare
 * @param {*} b - Second value to compare
 * @returns {boolean} True if values are deeply equal
 */
export function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a && b && typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false
    if (Array.isArray(a)) {
      return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
    }
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every((k) => deepEqual(a[k], b[k]))
  }
  return false
}

/**
 * Finds a schema node by following a JSONEditor path
 * @param {Object} schema - The root JSON schema
 * @param {Array} path - Array of path segments
 * @returns {Object|null} The schema node at the path, or null if not found
 */
export function findSchemaNode(schema, path) {
  if (!schema || !Array.isArray(path)) return null

  let node = schema
  for (const segment of path) {
    if (node.type === 'object' && node.properties && node.properties[segment]) {
      node = node.properties[segment]
    } else if (node.type === 'array' && node.items) {
      node = node.items
    } else {
      return null
    }
  }
  return node
}

/**
 * Gets a value at a specific path in an object
 * @param {Object} obj - The object to traverse
 * @param {Array} path - Array of path segments
 * @returns {*} The value at the path, or undefined if not found
 */
export function getValueAtPath(obj, path) {
  if (!obj || !Array.isArray(path)) return undefined
  return path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  )
}

/**
 * Determines if a schema node represents a read-only field
 * @param {Object} schema - The schema node to check
 * @returns {boolean} True if the field is read-only
 */
export function isReadOnlySchema(schema) {
  if (!schema || typeof schema !== 'object') return false
  // explicit readOnly flag
  if (schema.readOnly) return true
  // common "not" pattern meaning "this field must not be changed"
  if (schema.not && Object.keys(schema.not).length === 0) return true
  if (schema.not && schema.not.const !== undefined) return true
  return !!(schema.not && schema.not.type)
}

/**
 * Recursively checks for changes to read-only fields and adds validation errors
 * @param {*} data - Current data
 * @param {*} original - Original data to compare against
 * @param {Object} schema - JSON schema for validation
 * @param {Array} path - Current path in the data structure
 * @param {Array} errors - Array to accumulate errors
 * @returns {Array} Array of validation errors
 */
export function checkReadOnlyChanges(
  data,
  original,
  schema,
  path = [],
  errors = []
) {
  if (!schema || typeof schema !== 'object') return errors

  if (schema.readOnly) {
    const changed = !deepEqual(data, original)
    if (changed) {
      errors.push({
        path,
        message: 'This read-only field cannot be changed.'
      })
    }
  }

  if (schema.type === 'object' && schema.properties) {
    for (const [key, subschema] of Object.entries(schema.properties)) {
      const newVal = data ? data[key] : undefined
      const oldVal = original ? original[key] : undefined
      checkReadOnlyChanges(newVal, oldVal, subschema, [...path, key], errors)
    }
  } else if (schema.type === 'array' && Array.isArray(data) && schema.items) {
    data.forEach((item, i) => {
      const oldItem = Array.isArray(original) ? original[i] : undefined
      checkReadOnlyChanges(item, oldItem, schema.items, [...path, i], errors)
    })
  }

  return errors
}

/**
 * Highlights changed fields in the JSONEditor by comparing current and original data
 * @param {JSONEditor} editor - The JSONEditor instance
 * @param {*} current - Current data state
 * @param {*} original - Original data to compare against
 * @param {Array} path - Current path in the data structure
 */
export function highlightChanges(editor, current, original, path = []) {
  const changed = !deepEqual(current, original)

  // Try to find the node in the editor's tree
  const node = editor.node?.findNodeByPath?.(path)
  if (node) {
    const el =
      node.dom?.value ||
      node.dom?.field ||
      node.dom?.tr?.querySelector('.jsoneditor-value') ||
      node.dom?.tr?.querySelector('.jsoneditor-field')

    if (el) {
      if (changed) {
        el.classList.add('jsoneditor-changed')
      } else {
        el.classList.remove('jsoneditor-changed')
      }
    }
  }

  // Recurse into children
  if (Array.isArray(current) || Array.isArray(original)) {
    // handle arrays specially — highlight removals/additions
    const maxLength = Math.max(
      Array.isArray(current) ? current.length : 0,
      Array.isArray(original) ? original.length : 0
    )
    for (let i = 0; i < maxLength; i++) {
      highlightChanges(
        editor,
        current ? current[i] : undefined,
        original ? original[i] : undefined,
        [...path, i]
      )
    }
  } else if (
    typeof current === 'object' &&
    current !== null &&
    typeof original === 'object' &&
    original !== null
  ) {
    // objects: merge keys from both sides
    // Since we've already checked current and original are not null,
    // no need for || {} fallbacks
    const keys = new Set([...Object.keys(current), ...Object.keys(original)])
    for (const key of keys) {
      highlightChanges(editor, current?.[key], original?.[key], [...path, key])
    }
  }
}

/**
 * Manages localStorage operations for draft saving/loading
 */
export class LocalStorageManager {
  constructor(storageKey) {
    this.storageKey = storageKey
  }

  /**
   * Saves data to localStorage
   * @param {*} data - Data to save
   * @returns {boolean} True if save was successful
   */
  save(data) {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(data))
      return true
    } catch (err) {
      console.warn('Failed to save to localStorage:', err)
      return false
    }
  }

  /**
   * Loads data from localStorage
   * @returns {*|null} Parsed data or null if not found/invalid
   */
  load() {
    try {
      const saved = window.localStorage.getItem(this.storageKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (err) {
      console.warn('Failed to load localStorage draft:', err)
    }
    return null
  }

  /**
   * Removes data from localStorage
   * @returns {boolean} True if removal was successful
   */
  clear() {
    try {
      window.localStorage.removeItem(this.storageKey)
      return true
    } catch (err) {
      console.warn('Failed to clear localStorage draft:', err)
      return false
    }
  }
}

/**
 * Creates autocomplete options from schema enum values
 * @param {Object} schema - JSON schema
 * @param {Array} path - Path to the field
 * @returns {Array} Array of autocomplete options
 */
export function getAutocompleteOptions(schema, path) {
  const subschema = findSchemaNode(schema, path)
  if (subschema?.enum && Array.isArray(subschema.enum)) {
    return subschema.enum.map((v) => v.toString())
  }
  return []
}

/**
 * Filters context menu items to remove unwanted options
 * @param {Array} items - Original menu items
 * @param {Array} excludedItems - Items to exclude (by text or action)
 * @returns {Array} Filtered menu items
 */
export function filterContextMenu(items, excludedItems = ['Duplicate']) {
  return items.filter(
    (item) =>
      !excludedItems.includes(item.text) && !excludedItems.includes(item.action)
  )
}
