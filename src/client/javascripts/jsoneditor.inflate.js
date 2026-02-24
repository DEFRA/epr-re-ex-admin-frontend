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
    return data.map((item) => inflateRecursive(item, schema.items))
  }

  if (
    schemaTypeIncludes(schema, 'object') &&
    schema.properties &&
    typeof data === 'object'
  ) {
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
