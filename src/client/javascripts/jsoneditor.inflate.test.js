import { describe, it, expect } from 'vitest'
import { inflateNullObjects } from './jsoneditor.inflate.js'

describe('inflateNullObjects', () => {
  it('should inflate a null object field to an object with null properties', () => {
    const schema = {
      type: 'object',
      properties: {
        address: {
          type: ['object', 'null'],
          properties: {
            line1: { type: ['string', 'null'] },
            postcode: { type: ['string', 'null'] }
          }
        }
      }
    }
    const data = { address: null }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({
      address: { line1: null, postcode: null }
    })
  })

  it('should not modify a non-null object field', () => {
    const schema = {
      type: 'object',
      properties: {
        address: {
          type: ['object', 'null'],
          properties: {
            line1: { type: ['string', 'null'] },
            postcode: { type: ['string', 'null'] }
          }
        }
      }
    }
    const data = { address: { line1: 'High St', postcode: 'M1 1AA' } }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({
      address: { line1: 'High St', postcode: 'M1 1AA' }
    })
  })

  it('should not inflate null values for non-object types', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: ['string', 'null'] },
        count: { type: ['number', 'null'] }
      }
    }
    const data = { name: null, count: null }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({ name: null, count: null })
  })

  it('should not add fields that are missing from the data', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: {
          type: ['object', 'null'],
          properties: {
            line1: { type: ['string', 'null'] }
          }
        }
      }
    }
    const data = { name: 'Acme' }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({ name: 'Acme' })
    expect(result).not.toHaveProperty('address')
  })

  it('should recursively inflate nested null objects', () => {
    const schema = {
      type: 'object',
      properties: {
        site: {
          type: ['object', 'null'],
          properties: {
            address: {
              type: ['object', 'null'],
              properties: {
                line1: { type: ['string', 'null'] },
                postcode: { type: ['string', 'null'] }
              }
            },
            gridReference: { type: ['string', 'null'] }
          }
        }
      }
    }
    const data = { site: null }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({
      site: {
        address: { line1: null, postcode: null },
        gridReference: null
      }
    })
  })

  it('should inflate null nested objects inside a non-null parent', () => {
    const schema = {
      type: 'object',
      properties: {
        site: {
          type: ['object', 'null'],
          properties: {
            address: {
              type: ['object', 'null'],
              properties: {
                line1: { type: ['string', 'null'] },
                postcode: { type: ['string', 'null'] }
              }
            },
            gridReference: { type: ['string', 'null'] }
          }
        }
      }
    }
    const data = { site: { address: null, gridReference: 'AB123' } }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({
      site: {
        address: { line1: null, postcode: null },
        gridReference: 'AB123'
      }
    })
  })

  it('should inflate null object fields within array items', () => {
    const schema = {
      type: 'object',
      properties: {
        registrations: {
          type: 'array',
          items: {
            type: ['object', 'null'],
            properties: {
              noticeAddress: {
                type: ['object', 'null'],
                properties: {
                  line1: { type: ['string', 'null'] },
                  postcode: { type: ['string', 'null'] }
                }
              },
              status: { type: ['string', 'null'] }
            }
          }
        }
      }
    }
    const data = {
      registrations: [
        { noticeAddress: null, status: 'created' },
        {
          noticeAddress: { line1: 'Elm St', postcode: 'M2 2BB' },
          status: 'approved'
        }
      ]
    }

    const result = inflateNullObjects(data, schema)

    expect(result.registrations[0]).toEqual({
      noticeAddress: { line1: null, postcode: null },
      status: 'created'
    })
    expect(result.registrations[1]).toEqual({
      noticeAddress: { line1: 'Elm St', postcode: 'M2 2BB' },
      status: 'approved'
    })
  })

  it('should inflate null array items that have object type', () => {
    const schema = {
      type: 'object',
      properties: {
        registrations: {
          type: 'array',
          items: {
            type: ['object', 'null'],
            properties: {
              id: { type: ['string', 'null'] },
              status: { type: ['string', 'null'] }
            }
          }
        }
      }
    }
    const data = { registrations: [null, { id: 'r1', status: 'created' }] }

    const result = inflateNullObjects(data, schema)

    expect(result.registrations[0]).toEqual({ id: null, status: null })
    expect(result.registrations[1]).toEqual({ id: 'r1', status: 'created' })
  })

  it('should handle empty arrays', () => {
    const schema = {
      type: 'object',
      properties: {
        registrations: {
          type: 'array',
          items: {
            type: ['object', 'null'],
            properties: {
              id: { type: ['string', 'null'] }
            }
          }
        }
      }
    }
    const data = { registrations: [] }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({ registrations: [] })
  })

  it('should inflate to empty object when schema has no properties', () => {
    const schema = {
      type: 'object',
      properties: {
        metadata: {
          type: ['object', 'null']
        }
      }
    }
    const data = { metadata: null }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({ metadata: {} })
  })

  it('should handle string type "object" as well as union types', () => {
    const schema = {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          properties: {
            setting: { type: 'string' }
          }
        }
      }
    }
    const data = { config: null }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({ config: { setting: null } })
  })

  it('should handle null or undefined inputs defensively', () => {
    const schema = {
      type: 'object',
      properties: { name: { type: 'string' } }
    }

    expect(inflateNullObjects(null, schema)).toBe(null)
    expect(inflateNullObjects(undefined, schema)).toBe(undefined)
    expect(inflateNullObjects({ name: 'test' }, null)).toEqual({
      name: 'test'
    })
    expect(inflateNullObjects({ name: 'test' }, undefined)).toEqual({
      name: 'test'
    })
  })

  it('should not mutate the original data', () => {
    const schema = {
      type: 'object',
      properties: {
        address: {
          type: ['object', 'null'],
          properties: {
            line1: { type: ['string', 'null'] }
          }
        }
      }
    }
    const data = { address: null }

    inflateNullObjects(data, schema)

    expect(data).toEqual({ address: null })
  })

  it('should handle union-typed arrays', () => {
    const schema = {
      type: 'object',
      properties: {
        items: {
          type: ['array', 'null'],
          items: {
            type: ['object', 'null'],
            properties: {
              name: { type: ['string', 'null'] }
            }
          }
        }
      }
    }
    const data = { items: [null] }

    const result = inflateNullObjects(data, schema)

    expect(result).toEqual({ items: [{ name: null }] })
  })

  it('should handle a realistic registration-shaped structure', () => {
    const schema = {
      type: 'object',
      properties: {
        registrations: {
          type: 'array',
          items: {
            type: ['object', 'null'],
            properties: {
              id: { type: ['string', 'null'], readOnly: true },
              status: { type: ['string', 'null'] },
              registrationNumber: { type: ['string', 'null'] },
              noticeAddress: {
                type: ['object', 'null'],
                properties: {
                  line1: { type: ['string', 'null'] },
                  town: { type: ['string', 'null'] },
                  postcode: { type: ['string', 'null'] }
                }
              },
              site: {
                type: ['object', 'null'],
                properties: {
                  address: {
                    type: ['object', 'null'],
                    properties: {
                      line1: { type: ['string', 'null'] },
                      postcode: { type: ['string', 'null'] }
                    }
                  },
                  gridReference: { type: ['string', 'null'] }
                }
              },
              submitterContactDetails: {
                type: ['object', 'null'],
                properties: {
                  fullName: { type: ['string', 'null'] },
                  email: { type: ['string', 'null'] }
                }
              }
            }
          }
        }
      }
    }

    const data = {
      registrations: [
        {
          id: 'reg-1',
          status: 'created',
          registrationNumber: null,
          noticeAddress: null,
          site: { address: null, gridReference: 'AB123' },
          submitterContactDetails: {
            fullName: 'Joe Bloggs',
            email: 'joe@example.com'
          }
        }
      ]
    }

    const result = inflateNullObjects(data, schema)

    expect(result.registrations[0]).toEqual({
      id: 'reg-1',
      status: 'created',
      registrationNumber: null,
      noticeAddress: { line1: null, town: null, postcode: null },
      site: {
        address: { line1: null, postcode: null },
        gridReference: 'AB123'
      },
      submitterContactDetails: {
        fullName: 'Joe Bloggs',
        email: 'joe@example.com'
      }
    })
  })
})
