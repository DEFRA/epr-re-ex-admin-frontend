import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'
import validate from '#server/common/schemas/organisation.ajv.js'
import schema from '#server/common/schemas/organisation.json'
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

const container = document.getElementById('jsoneditor')
if (container) {
  try {
    const STORAGE_KEY = 'organisation-jsoneditor-draft'
    const storageManager = new LocalStorageManager(STORAGE_KEY)

    const payloadEl = document.getElementById('organisation-json')
    const originalData = payloadEl
      ? JSON.parse(payloadEl.textContent || '{}')
      : {}

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

    const editor = new JSONEditor(container, {
      mode: 'tree',
      modes: ['text', 'tree', 'preview'],

      // ✅ inline autocomplete based on schema enums
      autocomplete: {
        getOptions: (text, path) => getAutocompleteOptions(schema, path)
      },

      // 🧩 Remove "Duplicate" from context menu
      onCreateMenu: (items) =>
        filterContextMenu(items, ['Duplicate', 'duplicate']),

      // ... all your other options like onEditable, onValidate, autocomplete, etc.
      onEvent: (node, event) => {
        if (event.type === 'blur' || event.type === 'change') {
          const current = editor.get()

          // Save to localStorage on each change
          storageManager.save(current)

          // Highlight changes after save
          highlightChanges(editor, current, originalData)
        }
      },
      onExpand: () => {
        highlightChanges(editor, editor.get(), originalData)
      },

      onChangeJSON: (updatedJSON) => {
        // Save to localStorage whenever JSON changes (including deletions)
        storageManager.save(updatedJSON)

        // Highlight changes
        highlightChanges(editor, updatedJSON, originalData)
      },

      onEditable: (node) => {
        // skip root/meta nodes
        if (!node || !Array.isArray(node.path)) return true

        const subschema = findSchemaNode(schema, node.path)

        if (subschema === null) return false

        // 1️⃣ Read-only fields: completely locked
        if (isReadOnlySchema(subschema)) return false

        // 2️⃣ Object keys: lock key names but allow editing of values
        if (node.type === 'object' || node.field) {
          return { field: false, value: true }
        }

        // 3️⃣ Everything else: editable normally
        return true
      },

      // ✅ Validation (AJV + readOnly diff check)
      onValidate: (json) => {
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
          return !deepEqual(newValue, oldValue)
        })

        return errors
      }
    })

    // 🆕 Set editor data: prefer saved draft > original
    editor.set(savedData || originalData)

    // 🆕 Immediately highlight changes if draft differs
    highlightChanges(editor, savedData || originalData, originalData)

    const resetButton = document.getElementById('jsoneditor-reset-button')
    resetButton.addEventListener('click', () => {
      if (window.confirm('Are you sure you want to reset all changes?')) {
        // Clear localStorage and reset
        storageManager.clear()
        editor.set(originalData)
        highlightChanges(editor, originalData, originalData)
      }
    })

    const saveButton = document.getElementById('jsoneditor-save-button')
    saveButton.addEventListener('click', () => {
      try {
        const currentData = editor.get()

        // 🧩 Find or create a hidden form for submission
        const form = document.getElementById('jsoneditor-form')
        if (!form) {
          window.alert('Form element not found for submission.')
        }

        // 🧩 Add JSON payload as hidden input
        const hiddenInput = document.getElementById(
          'jsoneditor-organisation-object'
        )
        hiddenInput.value = JSON.stringify(currentData)

        // 🧩 Submit form normally
        form.submit()
      } catch (err) {
        console.error('Failed to save data:', err)
        window.alert('Failed to save data. See console for details.')
      }
    })
  } catch (err) {
    console.error('Failed to initialise JSONEditor:', err)
  }
}
