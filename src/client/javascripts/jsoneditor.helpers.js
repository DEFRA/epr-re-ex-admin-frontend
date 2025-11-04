import isEqual from 'lodash/isEqual.js'

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
 * Determines if a node in the JSONEditor is editable based on the schema
 * @param {Object} node - The JSONEditor node to check
 * @param {Object} rootSchema - The root JSON schema
 * @returns {boolean|Object} True if editable, false if not, or { field, value } for partial editability
 */
export function isNodeEditable(node, rootSchema) {
  // skip root/meta nodes
  if (!node || !Array.isArray(node.path)) return true

  const subschema = findSchemaNode(rootSchema, node.path)

  if (subschema === null) return false

  // 1️⃣ Read-only fields: completely locked
  // Check if schema indicates read-only through various patterns
  if (subschema && typeof subschema === 'object') {
    // explicit readOnly flag
    if (subschema.readOnly) return false
    // common "not" pattern meaning "this field must not be changed"
    if (subschema.not && Object.keys(subschema.not).length === 0) return false
    if (subschema.not && subschema.not.const !== undefined) return false
    if (subschema.not && subschema.not.type) return false
  }

  // 2️⃣ Object keys: lock key names but allow editing of values
  if (node.type === 'object' || node.field) {
    return { field: false, value: true }
  }

  // 3️⃣ Everything else: editable normally
  return true
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
    const changed = !isEqual(data, original)
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
  const changed = !isEqual(current, original)

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
 * Validates JSON data against a schema using AJV and checks for read-only field changes
 * @param {*} json - The JSON data to validate
 * @param {*} originalData - The original data to compare against for read-only checks
 * @param {Object} schema - The JSON schema to validate against
 * @param {Function} validate - The AJV validation function
 * @returns {Array} Array of validation errors
 */
export function validateJSON(json, originalData, schema, validate) {
  let errors = []

  // 1️⃣ Run normal AJV validation
  const valid = validate(json)
  if (!valid && validate.errors) {
    errors.push(
      ...validate.errors.map((err) => {
        let message = err.message || 'Validation error'

        // 🧩 Customise enum messages
        if (err.keyword === 'enum' && err.params?.allowedValues) {
          const allowed = err.params.allowedValues
            .map((v) => JSON.stringify(v))
            .join(', ')
          message = `must be one of: ${allowed}`
        }

        return {
          path: err.instancePath
            ? err.instancePath
                .replace(/^\//, '')
                .split('/')
                .map(decodeURIComponent)
            : [],
          message
        }
      })
    )
  }

  // 2️⃣ Add readOnly checks *only if changed*
  checkReadOnlyChanges(json, originalData, schema, [], errors)

  // 3️⃣ 🔍 Filter: only show errors for changed fields
  errors = errors.filter((err) => {
    const newValue = getValueAtPath(json, err.path)
    const oldValue = getValueAtPath(originalData, err.path)
    return !isEqual(newValue, oldValue)
  })

  return errors
}
