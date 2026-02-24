import { schemaTypeIncludes } from './jsoneditor.schema-utils.js'

/**
 * Builds a template object from a schema with all leaf properties set to null.
 * Object-typed properties are recursively inflated.
 * @param {Object} schema - The JSON schema node with properties
 * @returns {Object} A template object with null values
 */
function buildNullTemplate(schema) {
  if (!schema.properties) {
    return {}
  }

  const template = {}

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    if (schemaTypeIncludes(propSchema, 'object') && propSchema.properties) {
      template[key] = buildNullTemplate(propSchema)
    } else {
      template[key] = null
    }
  }

  return template
}

/**
 * Inflates each item in an array using the schema's items definition.
 * @param {Array} data - The array data
 * @param {Object} schema - The JSON schema with items definition
 * @returns {Array} Array with null objects inflated
 */
function inflateArrayItems(data, schema) {
  return data.map((item) => inflateRecursive(item, schema.items))
}

/**
 * Inflates null object properties within an existing object.
 * @param {Object} data - The object data
 * @param {Object} schema - The JSON schema with properties
 * @returns {Object} Object with null sub-objects inflated
 */
function inflateObjectProperties(data, schema) {
  const result = {}

  for (const key of Object.keys(data)) {
    const propSchema = schema.properties[key]

    if (propSchema) {
      result[key] = inflateRecursive(data[key], propSchema)
    } else {
      result[key] = data[key]
    }
  }

  return result
}

/**
 * Recursively inflates null object values using the schema structure.
 * @param {*} data - The data to process
 * @param {Object} schema - The JSON schema for this data
 * @returns {*} Data with null objects replaced by inflated templates
 */
function inflateRecursive(data, schema) {
  if (data === null && schemaTypeIncludes(schema, 'object')) {
    return buildNullTemplate(schema)
  }

  if (data === null || data === undefined) {
    return data
  }

  if (
    schemaTypeIncludes(schema, 'array') &&
    Array.isArray(data) &&
    schema.items
  ) {
    return inflateArrayItems(data, schema)
  }

  if (
    schemaTypeIncludes(schema, 'object') &&
    schema.properties &&
    typeof data === 'object'
  ) {
    return inflateObjectProperties(data, schema)
  }

  return data
}

/**
 * Replaces null values with inflated object templates where the schema
 * indicates an object type. This makes null object fields editable in
 * JSONEditor's tree view by providing the full property structure.
 * @param {*} data - The root data object
 * @param {Object} schema - The JSON schema
 * @returns {*} Data with null objects inflated, or the original data if inputs are invalid
 */
export function inflateNullObjects(data, schema) {
  if (data == null || !schema) {
    return data
  }
  return inflateRecursive(data, schema)
}
