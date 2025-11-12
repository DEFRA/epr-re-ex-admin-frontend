import isEqual from 'lodash/isEqual.js'
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

/**
 * Finds a schema node by following a JSONEditor path
 * @param {Object} schema - The root JSON schema
 * @param {Array} path - Array of path segments
 * @returns {Object|null} The schema node at the path, or null if not found
 */
export function findSchemaNode(schema, path) {
  if (!schema || !Array.isArray(path)) {
    return null
  }

  let node = schema
  for (const segment of path) {
    if (node.type === 'object' && node.properties?.[segment]) {
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
  if (!obj || !Array.isArray(path)) {
    return undefined
  }
  return path.reduce((acc, key) => acc?.[key] || undefined, obj)
}

/**
 * Checks if a node is a root or meta node (nodes without valid paths)
 * @param {Object} node - The JSONEditor node to check
 * @returns {boolean} True if node is root/meta node
 */
function isRootOrMetaNode(node) {
  return !node || !Array.isArray(node.path)
}

/**
 * Checks if a schema indicates read-only status through various patterns
 * @param {Object} subschema - The schema to check
 * @returns {boolean} True if schema indicates read-only
 */
function isSchemaReadOnly(subschema) {
  if (typeof subschema !== 'object') {
    return false
  }

  // Check explicit readOnly flag
  if (subschema.readOnly) {
    return true
  }

  // Check "not" patterns that indicate read-only
  if (subschema.not) {
    // Empty "not" constraint means field must not be changed
    if (Object.keys(subschema.not).length === 0) {
      return true
    }
    // "not" with const or type also indicates read-only
    if (subschema.not.const !== undefined || subschema.not.type) {
      return true
    }
  }

  return false
}

/**
 * Checks if a node represents an object field (should have locked key names)
 * @param {Object} node - The JSONEditor node to check
 * @returns {boolean} True if node is an object field
 */
function isObjectField(node) {
  return node.type === 'object' || node.field
}

/**
 * Determines if a node in the JSONEditor is editable based on the schema
 * @param {Object} node - The JSONEditor node to check
 * @param {Object} rootSchema - The root JSON schema
 * @returns {boolean|Object} True if editable, false if not, or { field, value } for partial editability
 */
export function isNodeEditable(node, rootSchema) {
  // Root/meta nodes are always editable
  if (isRootOrMetaNode(node)) {
    return true
  }

  const subschema = findSchemaNode(rootSchema, node.path)
  if (!subschema) {
    return false
  }

  // Read-only fields are completely locked
  if (isSchemaReadOnly(subschema)) {
    return false
  }

  // Object keys: lock key names but allow editing of values
  if (isObjectField(node)) {
    return { field: false, value: true }
  }

  // Everything else is editable normally
  return true
}

/**
 * Adds a read-only change error if the field has changed
 * @param {*} data - Current data
 * @param {*} original - Original data to compare against
 * @param {Object} schema - JSON schema for validation
 * @param {Array} path - Current path in the data structure
 * @param {Array} errors - Array to accumulate errors
 */
function addReadOnlyErrorIfChanged(data, original, schema, path, errors) {
  if (schema.readOnly && !isEqual(data, original)) {
    errors.push({
      path,
      message: 'This read-only field cannot be changed.'
    })
  }
}

/**
 * Recursively checks read-only changes in object properties
 * @param {Object} data - Current object data
 * @param {Object} original - Original object data
 * @param {Object} schema - JSON schema with object properties
 * @param {Array} path - Current path in the data structure
 * @param {Array} errors - Array to accumulate errors
 */
function checkObjectPropertiesReadOnly(data, original, schema, path, errors) {
  for (const [key, subschema] of Object.entries(schema.properties)) {
    const newVal = data ? data[key] : undefined
    const oldVal = original ? original[key] : undefined
    checkReadOnlyChanges(newVal, oldVal, subschema, [...path, key], errors)
  }
}

/**
 * Recursively checks read-only changes in array items
 * @param {Array} data - Current array data
 * @param {*} original - Original data (may or may not be an array)
 * @param {Object} schema - JSON schema with array items definition
 * @param {Array} path - Current path in the data structure
 * @param {Array} errors - Array to accumulate errors
 */
function checkArrayItemsReadOnly(data, original, schema, path, errors) {
  for (const [i, item] of data.entries()) {
    const oldItem = Array.isArray(original) ? original[i] : undefined
    checkReadOnlyChanges(item, oldItem, schema.items, [...path, i], errors)
  }
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
  if (!schema || typeof schema !== 'object') {
    return errors
  }

  addReadOnlyErrorIfChanged(data, original, schema, path, errors)

  if (schema.type === 'object' && schema.properties) {
    checkObjectPropertiesReadOnly(data, original, schema, path, errors)
  }

  if (schema.type === 'array' && Array.isArray(data) && schema.items) {
    checkArrayItemsReadOnly(data, original, schema, path, errors)
  }

  return errors
}

/**
 * Finds the DOM element for a node in the JSONEditor tree
 * @param {Object} node - The JSONEditor node
 * @returns {HTMLElement|null} The DOM element or null if not found
 */
function findNodeDOMElement(node) {
  return (
    node.dom?.value ||
    node.dom?.field ||
    node.dom?.tr?.querySelector('.jsoneditor-value') ||
    node.dom?.tr?.querySelector('.jsoneditor-field')
  )
}

/**
 * Highlights a single node in the editor tree
 * @param {JSONEditor} editor - The JSONEditor instance
 * @param {boolean} changed - Whether the data has changed
 * @param {Array} path - Current path in the data structure
 */
function highlightNode(editor, changed, path) {
  const node = editor.node?.findNodeByPath?.(path)
  if (!node) {
    return
  }

  const element = findNodeDOMElement(node)
  if (element) {
    if (changed) {
      element.classList.add('jsoneditor-changed')
    } else {
      element.classList.remove('jsoneditor-changed')
    }
  }
}

/**
 * Recursively highlights changes in array elements
 * @param {JSONEditor} editor - The JSONEditor instance
 * @param {*} current - Current array data
 * @param {*} original - Original array data
 * @param {Array} path - Current path in the data structure
 */
function highlightArrayChanges(editor, current, original, path) {
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
}

/**
 * Recursively highlights changes in object properties
 * @param {JSONEditor} editor - The JSONEditor instance
 * @param {Object} current - Current object data
 * @param {Object} original - Original object data
 * @param {Array} path - Current path in the data structure
 */
function highlightObjectChanges(editor, current, original, path) {
  const keys = new Set([...Object.keys(current), ...Object.keys(original)])
  for (const key of keys) {
    highlightChanges(editor, current?.[key], original?.[key], [...path, key])
  }
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

  highlightNode(editor, changed, path)

  // Handle arrays
  if (Array.isArray(current) || Array.isArray(original)) {
    highlightArrayChanges(editor, current, original, path)
    return
  }

  // Handle objects
  if (
    typeof current === 'object' &&
    current !== null &&
    typeof original === 'object' &&
    original !== null
  ) {
    highlightObjectChanges(editor, current, original, path)
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
      globalThis.localStorage.setItem(this.storageKey, JSON.stringify(data))
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
      const saved = globalThis.localStorage.getItem(this.storageKey)
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
      globalThis.localStorage.removeItem(this.storageKey)
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

/**
 * Syncs data to a hidden input element
 * @param {string} hiddenInputId - The ID of the hidden input element
 * @param {*} data - The data to sync
 */
function syncHiddenInput(hiddenInputId, data) {
  const hiddenInput = document.getElementById(hiddenInputId)
  if (hiddenInput) {
    hiddenInput.value = JSON.stringify(data)
  }
}

/**
 * Loads original data from the payload element
 * @param {string} payloadElementId - The ID of the payload element
 * @returns {Object|null} Parsed original data or null if not found
 */
function loadOriginalData(payloadElementId) {
  const payloadEl = document.getElementById(payloadElementId)
  if (!payloadEl) {
    console.error('Payload element not found')
    return null
  }
  return JSON.parse(payloadEl.textContent)
}

/**
 * Clears localStorage if success message is present
 * @param {string} successMessageId - The ID of the success message element
 * @param {LocalStorageManager} storageManager - Storage manager instance
 */
function clearStorageIfSuccessful(successMessageId, storageManager) {
  const messageEl = document.getElementById(successMessageId)
  if (messageEl && storageManager.clear()) {
    console.info('[JSONEditor] Cleared draft from localStorage after save')
  }
}

/**
 * Updates the save button state based on validation errors
 * @param {string} saveButtonId - The ID of the save button
 * @param {Array} errors - Array of validation errors
 */
function updateSaveButtonState(saveButtonId, errors) {
  const saveButton = document.getElementById(saveButtonId)
  if (saveButton) {
    saveButton.disabled = errors.length > 0
  }
}

/**
 * Creates JSONEditor configuration options
 * @param {Object} schema - JSON schema
 * @param {Function} validate - AJV validation function
 * @param {Object} originalData - Original data for comparison
 * @param {string} hiddenInputId - The ID of the hidden input element
 * @param {string} saveButtonId - The ID of the save button
 * @param {LocalStorageManager} storageManager - Storage manager instance
 * @param {Function} getEditor - Function to get the editor instance
 * @returns {Object} JSONEditor configuration object
 */
function createEditorConfig(
  schema,
  validate,
  originalData,
  hiddenInputId,
  saveButtonId,
  storageManager,
  getEditor
) {
  return {
    mode: 'tree',
    modes: ['text', 'tree', 'preview'],
    autocomplete: {
      getOptions: (_text, path) => getAutocompleteOptions(schema, path)
    },
    onCreateMenu: (items) => {
      const excludedItems = new Set(['Duplicate', 'duplicate'])
      return items.filter(
        (item) =>
          !excludedItems.has(item.text) && !excludedItems.has(item.action)
      )
    },
    onEvent: (_node, event) => {
      if (event.type === 'blur' || event.type === 'change') {
        const editor = getEditor()
        const currentData = editor.get()
        storageManager.save(currentData)
        syncHiddenInput(hiddenInputId, currentData)
        highlightChanges(editor, currentData, originalData)
      }
    },
    onExpand: () => {
      const editor = getEditor()
      highlightChanges(editor, editor.get(), originalData)
    },
    onChangeJSON: (updatedJSON) => {
      const editor = getEditor()
      storageManager.save(updatedJSON)
      syncHiddenInput(hiddenInputId, updatedJSON)
      highlightChanges(editor, updatedJSON, originalData)
    },
    onEditable: (node) => isNodeEditable(node, schema),
    onValidate: (json) => {
      const errors = validateJSON(json, originalData, schema, validate)
      updateSaveButtonState(saveButtonId, errors)
      return errors
    }
  }
}

/**
 * Sets up the reset button handler
 * @param {string} resetButtonId - The ID of the reset button
 * @param {LocalStorageManager} storageManager - Storage manager instance
 * @param {JSONEditor} editor - The JSONEditor instance
 * @param {*} originalData - The original data to reset to
 * @param {string} hiddenInputId - The ID of the hidden input element
 */
function setupResetButton(
  resetButtonId,
  storageManager,
  editor,
  originalData,
  hiddenInputId
) {
  const resetButton = document.getElementById(resetButtonId)
  resetButton.addEventListener('click', () => {
    if (globalThis.confirm('Are you sure you want to reset all changes?')) {
      storageManager.clear()
      editor.set(originalData)
      syncHiddenInput(hiddenInputId, originalData)
      highlightChanges(editor, originalData, originalData)
    }
  })
}

/**
 * Initialise the JSONEditor for organisation data
 * @param {Object} options - Configuration options
 * @param {Object} options.schema - The JSON schema for validation
 * @param {Function} options.validate - The AJV validation function
 * @param {string} options.storageKey - The localStorage key for draft storage
 * @param {string} options.containerId - The ID of the container element
 * @param {string} options.payloadElementId - The ID of the element containing original JSON data
 * @param {string} options.hiddenInputId - The ID of the hidden input for form submission
 * @param {string} options.successMessageId - The ID of the success message element
 * @param {string} options.resetButtonId - The ID of the reset button
 * @param {string} options.saveButtonId - The ID of the save button
 */
export function initJSONEditor({
  schema,
  validate,
  storageKey,
  containerId = 'jsoneditor',
  payloadElementId = 'organisation-json',
  hiddenInputId = 'jsoneditor-organisation-object',
  successMessageId = 'organisation-success-message',
  resetButtonId = 'jsoneditor-reset-button',
  saveButtonId = 'jsoneditor-save-button'
}) {
  const container = document.getElementById(containerId)
  if (!container) {
    return
  }

  try {
    const originalData = loadOriginalData(payloadElementId)
    if (!originalData) {
      return
    }

    const organisationId = originalData.id || 'unknown'
    const fullStorageKey = `${storageKey}-${organisationId}`
    const storageManager = new LocalStorageManager(fullStorageKey)

    clearStorageIfSuccessful(successMessageId, storageManager)

    const savedData = storageManager.load()
    if (savedData) {
      console.info('[JSONEditor] Loaded draft from localStorage')
    }

    const editorConfig = createEditorConfig(
      schema,
      validate,
      originalData,
      hiddenInputId,
      saveButtonId,
      storageManager,
      () => editor
    )
    const editor = new JSONEditor(container, editorConfig)

    // Load data
    editor.set(savedData || originalData)
    syncHiddenInput(hiddenInputId, savedData || originalData)
    highlightChanges(editor, savedData || originalData, originalData)

    // Initialise save button state
    const initialErrors = validateJSON(
      savedData || originalData,
      originalData,
      schema,
      validate
    )
    updateSaveButtonState(saveButtonId, initialErrors)

    setupResetButton(
      resetButtonId,
      storageManager,
      editor,
      originalData,
      hiddenInputId
    )
  } catch (err) {
    console.error('Failed to initialise JSONEditor:', err)
  }
}
