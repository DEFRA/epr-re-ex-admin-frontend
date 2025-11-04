import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'
import validate from '#server/common/schemas/organisation.ajv.js'
import schema from '#server/common/schemas/organisation.json'
import {
  isNodeEditable,
  highlightChanges,
  LocalStorageManager,
  getAutocompleteOptions,
  validateJSON
} from './jsoneditor.helpers.js'

const STORAGE_KEY = 'organisation-jsoneditor-draft'

const container = document.getElementById('jsoneditor')
if (container) {
  try {
    const storageManager = new LocalStorageManager(STORAGE_KEY)

    const payloadEl = document.getElementById('organisation-json')
    const originalData = payloadEl
      ? JSON.parse(payloadEl.textContent || '{}')
      : {}

    // Get reference to hidden input for form submission
    const hiddenInput = document.getElementById(
      'jsoneditor-organisation-object'
    )

    // Clear local storage if success message present
    const messageEl = document.getElementById('organisation-success-message')
    if (messageEl) {
      if (storageManager.clear()) {
        console.info('[JSONEditor] Cleared draft from localStorage after save')
      }
    }

    // Load from localStorage if exists
    const savedData = storageManager.load()
    if (savedData) {
      console.info('[JSONEditor] Loaded draft from localStorage')
    }

    // Helper function to sync hidden input with editor data
    const syncHiddenInput = (data) => {
      if (hiddenInput) {
        hiddenInput.value = JSON.stringify(data)
      }
    }

    const editor = new JSONEditor(container, {
      mode: 'tree',
      modes: ['text', 'tree', 'preview'],

      // ✅ inline autocomplete based on schema enums
      autocomplete: {
        getOptions: (text, path) => getAutocompleteOptions(schema, path)
      },

      // 🧩 Remove "Duplicate" from context menu
      onCreateMenu: (items) => {
        const excludedItems = ['Duplicate', 'duplicate']
        return items.filter(
          (item) =>
            !excludedItems.includes(item.text) &&
            !excludedItems.includes(item.action)
        )
      },
      onEvent: (node, event) => {
        if (event.type === 'blur' || event.type === 'change') {
          const currentData = editor.get()
          storageManager.save(currentData)
          syncHiddenInput(currentData)
          highlightChanges(editor, currentData, originalData)
        }
      },
      onExpand: () => {
        highlightChanges(editor, editor.get(), originalData)
      },
      onChangeJSON: (updatedJSON) => {
        storageManager.save(updatedJSON)
        syncHiddenInput(updatedJSON)
        highlightChanges(editor, updatedJSON, originalData)
      },
      onEditable: (node) => {
        return isNodeEditable(node, schema)
      },
      onValidate: (json) => {
        return validateJSON(json, originalData, schema, validate)
      }
    })

    // 🆕 Set editor data: prefer saved draft > original
    editor.set(savedData || originalData)

    // 🆕 Sync hidden input with initial data
    syncHiddenInput(savedData || originalData)

    // 🆕 Immediately highlight changes if draft differs
    highlightChanges(editor, savedData || originalData, originalData)

    const resetButton = document.getElementById('jsoneditor-reset-button')
    resetButton.addEventListener('click', () => {
      if (window.confirm('Are you sure you want to reset all changes?')) {
        // Clear localStorage and reset
        storageManager.clear()
        editor.set(originalData)
        syncHiddenInput(originalData)
        highlightChanges(editor, originalData, originalData)
      }
    })
  } catch (err) {
    console.error('Failed to initialise JSONEditor:', err)
  }
}
