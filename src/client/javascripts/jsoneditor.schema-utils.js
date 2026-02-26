/**
 * Checks if a schema's type includes a specific type name.
 * Handles both string types (e.g. "object") and union types (e.g. ["object", "null"]).
 * @param {Object} schema - The JSON schema node
 * @param {string} typeName - The type to check for (e.g. 'object', 'array')
 * @returns {boolean} True if the schema type includes the given type name
 */
export function schemaTypeIncludes(schema, typeName) {
  if (!schema?.type) {
    return false
  }

  if (typeof schema.type === 'string') {
    return schema.type === typeName
  }

  if (Array.isArray(schema.type)) {
    return schema.type.includes(typeName)
  }

  return false
}
