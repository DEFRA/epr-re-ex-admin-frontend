import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'
import validate from '#server/common/schemas/organisation.ajv.js'
import schema from '#server/common/schemas/organisation.json'

const container = document.getElementById('jsoneditor')
if (container) {
  try {
    const payloadEl = document.getElementById('organisation-json')
    const originalData = payloadEl
      ? JSON.parse(payloadEl.textContent || '{}')
      : {}

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

      onEditable: (node) => {
        // skip root/meta nodes
        if (!node || !Array.isArray(node.path)) return true

        const subschema = findSchemaNode(schema, node.path)

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

    editor.set(originalData)
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
