import { toRegAccPairs, toSlimOrganisation } from './helpers.js'

const buildOrganisation = (overrides = {}) => ({
  name: 'Acme Ltd',
  organisationNumber: '100001',
  registrations: {},
  status: { current: 'active' },
  submittedToRegulator: { code: 'ea' },
  ...overrides
})

describe('toRegAccPairs', () => {
  it('pairs a registration with its accreditation number', () => {
    const pairs = toRegAccPairs({
      registrations: {
        REG001: { accreditations: { 2026: { accreditationNumber: 'ACC001' } } }
      }
    })

    expect(pairs).toEqual([
      { registrationNumber: 'REG001', accreditationNumber: 'ACC001' }
    ])
  })

  it('gives each accreditation year of a registration its own line, oldest first', () => {
    const pairs = toRegAccPairs({
      registrations: {
        REG001: {
          accreditations: {
            2027: { accreditationNumber: 'ACC027' },
            2026: { accreditationNumber: 'ACC026' }
          }
        }
      }
    })

    expect(pairs).toEqual([
      { registrationNumber: 'REG001', accreditationNumber: 'ACC026' },
      { registrationNumber: 'REG001', accreditationNumber: 'ACC027' }
    ])
  })

  it('leaves the accreditation number null for a registration with no accreditation', () => {
    const pairs = toRegAccPairs({
      registrations: { REG002: { accreditations: {} } }
    })

    expect(pairs).toEqual([
      { registrationNumber: 'REG002', accreditationNumber: null }
    ])
  })

  it('returns no pairs when the organisation holds no registrations', () => {
    expect(toRegAccPairs({ registrations: {} })).toEqual([])
  })
})

describe('toSlimOrganisation', () => {
  it('projects the fields the organisations table renders', () => {
    const slim = toSlimOrganisation(
      buildOrganisation({
        registrations: {
          REG001: {
            accreditations: { 2026: { accreditationNumber: 'ACC001' } }
          }
        }
      })
    )

    expect(slim).toEqual({
      organisationNumber: '100001',
      name: 'Acme Ltd',
      regAccPairs: [
        { registrationNumber: 'REG001', accreditationNumber: 'ACC001' }
      ],
      status: 'active',
      regulator: 'ea'
    })
  })
})
