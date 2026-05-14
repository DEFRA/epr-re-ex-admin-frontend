import isEqual from 'lodash/isEqual.js'
import { schemaTypeIncludes } from './jsoneditor.schema-utils.js'

/**
 * @import { ValidateFunction } from 'ajv'
 */

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
  return path.reduce((acc, key) => acc?.[key], obj)
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

  if (schemaTypeIncludes(schema, 'object') && schema.properties) {
    checkObjectPropertiesReadOnly(data, original, schema, path, errors)
  }

  if (
    schemaTypeIncludes(schema, 'array') &&
    Array.isArray(data) &&
    schema.items
  ) {
    checkArrayItemsReadOnly(data, original, schema, path, errors)
  }

  return errors
}

/**
 * Validates JSON data against a schema using AJV and checks for read-only field changes
 * @param {*} json - The JSON data to validate
 * @param {*} originalData - The original data to compare against for read-only checks
 * @param {Object} schema - The JSON schema to validate against
 * @param {ValidateFunction} validate - The AJV validation function
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

        // Parse the base path
        let path = err.instancePath
          ? err.instancePath
              .replace(/^\//, '')
              .split('/')
              .map(decodeURIComponent)
          : []

        // Handle additionalProperties errors - append the property name to the path
        if (
          err.keyword === 'additionalProperties' &&
          err.params?.additionalProperty
        ) {
          path = [...path, err.params.additionalProperty]
        }

        return {
          path,
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
