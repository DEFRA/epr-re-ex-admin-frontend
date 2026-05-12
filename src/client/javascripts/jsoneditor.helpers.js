import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'
import isEqual from 'lodash/isEqual.js'
import { buildNullTemplate, inflateNullObjects } from './jsoneditor.inflate.js'
import { schemaTypeIncludes } from './jsoneditor.schema-utils.js'
import { validateJSON } from './jsoneditor.validation.js'

/**
 * @import { ValidateFunction } from 'ajv'
 */

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
    if (schemaTypeIncludes(node, 'object') && node.properties?.[segment]) {
      node = node.properties[segment]
    } else if (schemaTypeIncludes(node, 'array') && node.items) {
      node = node.items
    } else {
      return null
    }
  }
  return node
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
 * @returns {boolean|Object} True if editable, false if not, or { field, value } for partial editability
 */
export function isNodeEditable(node) {
  // Object keys: lock key names but allow editing of values
  if (isObjectField(node)) {
    return { field: false, value: true }
  }

  // Everything else is editable normally
  return true
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
    } catch {
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
    } catch {
      // Error falls through to return null
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
    } catch {
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
 * Syncs data to a hidden input element
 * @param {string} hiddenInputId - The ID of the hidden input element
 * @param {*} data - The data to sync
 */
function syncHiddenInput(hiddenInputId, data) {
  const hiddenInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById(hiddenInputId)
  )
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
  if (messageEl) {
    storageManager.clear()
  }
}

/**
 * Updates the save button state based on validation errors
 * @param {string} saveButtonId - The ID of the save button
 * @param {Array} errors - Array of validation errors
 */
function updateSaveButtonState(saveButtonId, errors) {
  const saveButton = /** @type {HTMLButtonElement | null} */ (
    document.getElementById(saveButtonId)
  )
  if (saveButton) {
    saveButton.disabled = errors.length > 0
  }
}

function isDraftValid(draftData, backendData) {
  const draftVersion = draftData.version
  const backendVersion = backendData.version
  return draftVersion === backendVersion
}

function injectDraftStaleWarning(staleWarningPlaceholderId) {
  const container = document.getElementById(staleWarningPlaceholderId)
  if (!container) {
    return
  }
  container.innerHTML = `
  <div class="govuk-notification-banner" role="region" aria-labelledby="govuk-notification-banner-title" data-module="govuk-notification-banner" tabindex="-1">
    <div class="govuk-notification-banner__header">
      <h2 class="govuk-notification-banner__title" id="govuk-notification-banner-title">
        Important
      </h2>
    </div>
    <div class="govuk-notification-banner__content">
      <h3 class="govuk-notification-banner__heading">
        Unsaved changes have been removed
      </h3>
      <p class="govuk-body">
        This record has been updated since you started editing.
        To prevent you from overwriting these changes, your unsaved work has been cleared and you are now viewing the latest version.
      </p>
    </div>
  </div>
`
}

function clearDraftIfStale(
  storageManager,
  originalData,
  staleDraftWarningPlaceholderId
) {
  const savedData = storageManager.load()
  if (savedData) {
    const isValid = isDraftValid(savedData, originalData)
    if (!isValid) {
      storageManager.clear()
      injectDraftStaleWarning(staleDraftWarningPlaceholderId)
    }
  }
}

/**
 * Creates JSONEditor configuration options
 * @param {Object} options - Configuration options
 * @param {Object} options.schema - JSON schema
 * @param {ValidateFunction} options.validate - AJV validation function
 * @param {Object} options.originalData - Original data for comparison
 * @param {string} options.hiddenInputId - The ID of the hidden input element
 * @param {string} options.saveButtonId - The ID of the save button
 * @param {LocalStorageManager} options.storageManager - Storage manager instance
 * @param {Function} options.getEditor - Function to get the editor instance
 * @returns {Object} JSONEditor configuration object
 */
function createEditorConfig({
  schema,
  validate,
  originalData,
  hiddenInputId,
  saveButtonId,
  storageManager,
  getEditor
}) {
  return {
    mode: 'tree',
    modes: ['text', 'tree'],
    enableSort: false,
    enableTransform: false,
    limitDragging: true,
    autocomplete: {
      getOptions: (_text, path) => getAutocompleteOptions(schema, path)
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
    onChangeText: (updatedJSONText) => {
      const updatedJSON = JSON.parse(updatedJSONText)

      const editor = getEditor()
      storageManager.save(updatedJSON)
      syncHiddenInput(hiddenInputId, updatedJSON)
      highlightChanges(editor, updatedJSON, originalData)
    },
    onModeChange: () => {
      const editor = getEditor()
      const latestData = editor.get()
      syncHiddenInput(hiddenInputId, latestData)
      highlightChanges(editor, latestData, originalData)
    },
    onEditable: (node) => isNodeEditable(node),
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
  if (!resetButton) {
    return
  }
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
 * Wires an append button that adds a new item to an array in the editor
 * @param {string} buttonId - The ID of the button element
 * @param {string} arrayKey - The top-level property key for the array
 * @param {Object} template - The null template to append
 * @param {JSONEditor} editor - The JSONEditor instance
 * @param {LocalStorageManager} storageManager - Storage manager instance
 * @param {string} hiddenInputId - The ID of the hidden input element
 * @param {Object} originalData - The inflated original data for highlighting
 */
function setupAppendButton(
  buttonId,
  arrayKey,
  template,
  editor,
  storageManager,
  hiddenInputId,
  originalData
) {
  const button = document.getElementById(buttonId)

  if (!button) {
    return
  }

  button.addEventListener('click', () => {
    const data = structuredClone(editor.get())

    if (!Array.isArray(data[arrayKey])) {
      return
    }

    data[arrayKey].push(structuredClone(template))
    editor.update(data)
    storageManager.save(data)
    syncHiddenInput(hiddenInputId, data)
    highlightChanges(editor, data, originalData)
  })
}

/**
 * Wires up append buttons for arrays defined in the schema
 * @param {Object} schema - The JSON schema
 * @param {JSONEditor} editor - The JSONEditor instance
 * @param {LocalStorageManager} storageManager - Storage manager instance
 * @param {string} hiddenInputId - The ID of the hidden input element
 * @param {Object} originalData - The inflated original data for highlighting
 */
function setupAppendButtons(
  schema,
  editor,
  storageManager,
  hiddenInputId,
  originalData
) {
  const appendButtons = [
    { buttonId: 'add-registration-button', arrayKey: 'registrations' },
    { buttonId: 'add-accreditation-button', arrayKey: 'accreditations' }
  ]

  for (const { buttonId, arrayKey } of appendButtons) {
    const arraySchema = findSchemaNode(schema, [arrayKey])

    const itemSchema = arraySchema?.items
    if (!itemSchema) {
      continue
    }

    const template = buildNullTemplate(itemSchema)

    setupAppendButton(
      buttonId,
      arrayKey,
      template,
      editor,
      storageManager,
      hiddenInputId,
      originalData
    )
  }
}

/**
 * Loads and prepares data for the editor, handling drafts and inflation
 * @param {Object} schema - The JSON schema
 * @param {string} storageKey - The localStorage key for draft storage
 * @param {string} payloadElementId - The ID of the element containing original JSON data
 * @param {string} successMessageId - The ID of the success message element
 * @param {string} staleDraftWarningPlaceholderId - The ID of the stale draft warning placeholder
 * @returns {Object|null} { storageManager, inflatedOriginalData, inflatedSavedData } or null
 */
function loadEditorData(
  schema,
  storageKey,
  payloadElementId,
  successMessageId,
  staleDraftWarningPlaceholderId
) {
  const originalData = loadOriginalData(payloadElementId)

  if (!originalData) {
    return null
  }

  const organisationId = originalData.id || 'unknown'
  const fullStorageKey = `${storageKey}-${organisationId}`
  const storageManager = new LocalStorageManager(fullStorageKey)

  clearStorageIfSuccessful(successMessageId, storageManager)
  clearDraftIfStale(
    storageManager,
    originalData,
    staleDraftWarningPlaceholderId
  )

  const inflatedOriginalData = inflateNullObjects(originalData, schema)

  const savedData = storageManager.load()
  const inflatedSavedData = savedData
    ? inflateNullObjects(savedData, schema)
    : null

  return { storageManager, inflatedOriginalData, inflatedSavedData }
}

/**
 * Initialise the JSONEditor for organisation data
 * @param {Object} options - Configuration options
 * @param {Object} options.schema - The JSON schema for validation
 * @param {ValidateFunction} options.validate - The AJV validation function
 * @param {string} options.storageKey - The localStorage key for draft storage
 * @param {string} [options.containerId] - The ID of the container element
 * @param {string} [options.payloadElementId] - The ID of the element containing original JSON data
 * @param {string} [options.hiddenInputId] - The ID of the hidden input for form submission
 * @param {string} [options.successMessageId] - The ID of the success message element
 * @param {string} [options.resetButtonId] - The ID of the reset button
 * @param {string} [options.saveButtonId] - The ID of the save button
 * @param {string} [options.staleDraftWarningPlaceholderId] - The ID of the stale draft warning placeholder
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
  saveButtonId = 'jsoneditor-save-button',
  staleDraftWarningPlaceholderId = 'stale-draft-warning-placeholder'
}) {
  const container = document.getElementById(containerId)
  if (!container) {
    return
  }

  const editorData = loadEditorData(
    schema,
    storageKey,
    payloadElementId,
    successMessageId,
    staleDraftWarningPlaceholderId
  )

  if (!editorData) {
    return
  }

  const { storageManager, inflatedOriginalData, inflatedSavedData } = editorData

  const editorConfig = createEditorConfig({
    schema,
    validate,
    originalData: inflatedOriginalData,
    hiddenInputId,
    saveButtonId,
    storageManager,
    getEditor: () => editor
  })
  const editor = new JSONEditor(container, editorConfig)

  // Load data
  const dataToLoad = inflatedSavedData || inflatedOriginalData
  editor.set(dataToLoad)
  syncHiddenInput(hiddenInputId, dataToLoad)
  highlightChanges(editor, dataToLoad, inflatedOriginalData)

  // Initialise save button state
  const initialErrors = validateJSON(
    dataToLoad,
    inflatedOriginalData,
    schema,
    validate
  )

  updateSaveButtonState(saveButtonId, initialErrors)

  setupAppendButtons(
    schema,
    editor,
    storageManager,
    hiddenInputId,
    inflatedOriginalData
  )

  setupResetButton(
    resetButtonId,
    storageManager,
    editor,
    inflatedOriginalData,
    hiddenInputId
  )
}
