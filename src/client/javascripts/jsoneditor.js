import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'
import validate from '#server/common/schemas/organisation.ajv.js'
import schema from '#server/common/schemas/organisation.json'

const container = document.getElementById('jsoneditor')
if (container) {
  try {
    const STORAGE_KEY = 'organisation-jsoneditor-draft' // 🆕 define unique key

    const payloadEl = document.getElementById('organisation-json')
    const originalData = payloadEl
      ? JSON.parse(payloadEl.textContent || '{}')
      : {}

    // Clear local storage if success message present
    const messageEl = document.getElementById('organisation-success-message')
    if (messageEl) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
        console.info('[JSONEditor] Cleared draft from localStorage after save')
      } catch (err) {
        console.warn('Failed to clear localStorage draft:', err)
      }
    }

    // 🆕 Load from localStorage if exists
    let savedData = null
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        savedData = JSON.parse(saved)
        console.info('[JSONEditor] Loaded draft from localStorage')
      }
    } catch (err) {
      console.warn('Failed to load localStorage draft:', err)
    }

    const editor = new JSONEditor(container, {
      mode: 'tree',
      modes: ['text', 'tree', 'preview'],

      // ✅ inline autocomplete based on schema enums
      autocomplete: {
        getOptions: (text, path) => {
          const subschema = findSchemaNode(schema, path)
          if (subschema?.enum && Array.isArray(subschema.enum)) {
            // You can filter here if desired (case-insensitive match)
            return subschema.enum.map((v) => v.toString())
          }
          return []
        }
      },

      // 🧩 Remove "Duplicate" from context menu
      onCreateMenu: (items) => {
        // Filter out the duplicate option by text or action
        return items.filter(
          (item) => item.text !== 'Duplicate' && item.action !== 'duplicate'
        )
      },

      // ... all your other options like onEditable, onValidate, autocomplete, etc.
      onEvent: (node, event) => {
        if (event.type === 'blur' || event.type === 'change') {
          const current = editor.get()

          // 🆕 Save to localStorage on each change
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
          } catch (err) {
            console.warn('Failed to save to localStorage:', err)
          }

          // 🧩 Highlight changes after save
          highlightChanges(editor, current, originalData)
        }
      },
      onExpand: () => {
        highlightChanges(editor, editor.get(), originalData)
      },

      onChangeJSON: (updatedJSON) => {
        try {
          // Save to localStorage whenever JSON changes (including deletions)
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJSON))
        } catch (err) {
          console.warn('Failed to save to localStorage:', err)
        }

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
        // 🆕 Clear localStorage and reset
        window.localStorage.removeItem(STORAGE_KEY)
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

// 🔍 Helper: deep equality check
function deepEqual(a, b) {
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

// 🧩 Helper: find schema node by JSONEditor path (safe)
function findSchemaNode(schema, path) {
  if (!schema || !Array.isArray(path)) return null

  let node = schema
  for (const segment of path) {
    if (!node) return null
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

// 🧭 Helper: get value at a given path
function getValueAtPath(obj, path) {
  if (!obj || !Array.isArray(path)) return undefined
  return path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  )
}

function isReadOnlySchema(schema) {
  if (!schema || typeof schema !== 'object') return false
  // explicit readOnly flag
  if (schema.readOnly) return true
  // common "not" pattern meaning "this field must not be changed"
  if (schema.not && Object.keys(schema.not).length === 0) return true
  if (schema.not && schema.not.const !== undefined) return true
  return !!(schema.not && schema.not.type)
}

// 🧩 Helper: traverse schema & compare with original
function checkReadOnlyChanges(data, original, schema, path = [], errors = []) {
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

function highlightChanges(editor, current, original, path = []) {
  const changed = !deepEqual(current, original)

  // Try to find the node in the editor’s tree
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
    const keys = new Set([
      ...Object.keys(current || {}),
      ...Object.keys(original || {})
    ])
    for (const key of keys) {
      highlightChanges(editor, current?.[key], original?.[key], [...path, key])
    }
  }
}
