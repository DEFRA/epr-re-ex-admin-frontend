import { toRegAccPairs, toSlimOrganisation } from './helpers.js'

const buildOrganisation = (overrides = {}) => ({
  id: 'org-1',
  orgId: '100001',
  companyDetails: { name: 'Acme Ltd' },
  status: 'ACTIVE',
  submittedToRegulator: 'ea',
  ...overrides
})

describe('toRegAccPairs', () => {
  describe('when a registration references an accreditation', () => {
    it('pairs the registration number with the accreditation number', () => {
      const pairs = toRegAccPairs({
        registrations: [
          { registrationNumber: 'REG001', accreditationId: 'acc-1' }
        ],
        accreditations: [{ id: 'acc-1', accreditationNumber: 'ACC001' }]
      })

      expect(pairs).toEqual([
        { registrationNumber: 'REG001', accreditationNumber: 'ACC001' }
      ])
    })

    it('leaves the accreditation number null while the accreditation awaits approval', () => {
      const pairs = toRegAccPairs({
        registrations: [
          { registrationNumber: 'REG002', accreditationId: 'acc-2' }
        ],
        accreditations: [{ id: 'acc-2', accreditationNumber: null }]
      })

      expect(pairs).toEqual([
        { registrationNumber: 'REG002', accreditationNumber: null }
      ])
    })

    it('does not repeat a referenced accreditation as an orphan when its number is null', () => {
      const pairs = toRegAccPairs({
        registrations: [
          { registrationNumber: 'REG002', accreditationId: 'acc-2' }
        ],
        accreditations: [{ id: 'acc-2', accreditationNumber: null }]
      })

      expect(pairs).toHaveLength(1)
    })

    it('leaves the registration number null while the registration awaits approval', () => {
      const pairs = toRegAccPairs({
        registrations: [{ registrationNumber: null, accreditationId: 'acc-1' }],
        accreditations: [{ id: 'acc-1', accreditationNumber: 'ACC001' }]
      })

      expect(pairs).toEqual([
        { registrationNumber: null, accreditationNumber: 'ACC001' }
      ])
    })
  })

  describe('when a registration references no accreditation', () => {
    it('leaves the accreditation number null', () => {
      const pairs = toRegAccPairs({
        registrations: [{ registrationNumber: 'REG002' }]
      })

      expect(pairs).toEqual([
        { registrationNumber: 'REG002', accreditationNumber: null }
      ])
    })
  })

  describe('when an accreditation is referenced by no registration', () => {
    it('appends it after every registration pair', () => {
      const pairs = toRegAccPairs({
        registrations: [
          { registrationNumber: 'REG001', accreditationId: 'acc-1' }
        ],
        accreditations: [
          { id: 'acc-1', accreditationNumber: 'ACC001' },
          { id: 'acc-9', accreditationNumber: 'ACC444' }
        ]
      })

      expect(pairs).toEqual([
        { registrationNumber: 'REG001', accreditationNumber: 'ACC001' },
        { registrationNumber: null, accreditationNumber: 'ACC444' }
      ])
    })

    it('is the only line when the organisation holds no registrations at all', () => {
      const pairs = toRegAccPairs({
        accreditations: [{ id: 'acc-9', accreditationNumber: 'ACC444' }]
      })

      expect(pairs).toEqual([
        { registrationNumber: null, accreditationNumber: 'ACC444' }
      ])
    })

    it('lists orphans in accreditation order', () => {
      const pairs = toRegAccPairs({
        accreditations: [
          { id: 'acc-8', accreditationNumber: 'ACC333' },
          { id: 'acc-9', accreditationNumber: 'ACC444' }
        ]
      })

      expect(pairs).toEqual([
        { registrationNumber: null, accreditationNumber: 'ACC333' },
        { registrationNumber: null, accreditationNumber: 'ACC444' }
      ])
    })

    it('leaves its number null while it awaits approval', () => {
      const pairs = toRegAccPairs({
        accreditations: [{ id: 'acc-9', accreditationNumber: null }]
      })

      expect(pairs).toEqual([
        { registrationNumber: null, accreditationNumber: null }
      ])
    })
  })

  describe('when the organisation holds neither registrations nor accreditations', () => {
    it('returns no pairs', () => {
      expect(toRegAccPairs({})).toEqual([])
    })
  })
})

describe('toSlimOrganisation', () => {
  it('projects the fields the organisations table renders', () => {
    const slim = toSlimOrganisation(
      buildOrganisation({
        registrations: [
          { registrationNumber: 'REG001', accreditationId: 'acc-1' }
        ],
        accreditations: [{ id: 'acc-1', accreditationNumber: 'ACC001' }]
      })
    )

    expect(slim).toEqual({
      id: 'org-1',
      orgId: '100001',
      name: 'Acme Ltd',
      regAccPairs: [
        { registrationNumber: 'REG001', accreditationNumber: 'ACC001' }
      ],
      status: 'ACTIVE',
      regulator: 'ea'
    })
  })

  it('ignores companyDetails.registrationNumber, which the backend model does not hold', () => {
    const slim = toSlimOrganisation(
      buildOrganisation({
        companyDetails: { name: 'Acme Ltd', registrationNumber: '12345678' }
      })
    )

    expect(slim).not.toHaveProperty('registrationNumber')
  })
})
