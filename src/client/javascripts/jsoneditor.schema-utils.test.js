import { describe, it, expect } from 'vitest'
import { schemaTypeIncludes } from './jsoneditor.schema-utils.js'

describe('schemaTypeIncludes', () => {
  it('should return true for exact string type match', () => {
    expect(schemaTypeIncludes({ type: 'object' }, 'object')).toBe(true)
    expect(schemaTypeIncludes({ type: 'array' }, 'array')).toBe(true)
    expect(schemaTypeIncludes({ type: 'string' }, 'string')).toBe(true)
  })

  it('should return true when type array includes the target', () => {
    expect(schemaTypeIncludes({ type: ['object', 'null'] }, 'object')).toBe(
      true
    )
    expect(schemaTypeIncludes({ type: ['array', 'null'] }, 'array')).toBe(true)
    expect(schemaTypeIncludes({ type: ['string', 'null'] }, 'string')).toBe(
      true
    )
  })

  it('should return false when type does not match', () => {
    expect(schemaTypeIncludes({ type: 'string' }, 'object')).toBe(false)
    expect(schemaTypeIncludes({ type: ['string', 'null'] }, 'object')).toBe(
      false
    )
  })

  it('should return false for null or undefined schema', () => {
    expect(schemaTypeIncludes(null, 'object')).toBe(false)
    expect(schemaTypeIncludes(undefined, 'object')).toBe(false)
  })

  it('should return false for schema with no type', () => {
    expect(schemaTypeIncludes({}, 'object')).toBe(false)
    expect(schemaTypeIncludes({ properties: {} }, 'object')).toBe(false)
  })

  it('should return false for schema with non-string non-array type', () => {
    expect(schemaTypeIncludes({ type: 42 }, 'object')).toBe(false)
    expect(schemaTypeIncludes({ type: true }, 'object')).toBe(false)
  })
})
