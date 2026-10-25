import { vi } from 'vitest'
import {
  fetchOrganisationView,
  latestAccreditation,
  processingTypeOf,
  registrationIn,
  registrationRows,
  siteOf
} from './fetch-organisation-view.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/** @import { Request } from '@hapi/hapi' */
/** @import { OrganisationView, RegistrationView } from './fetch-organisation-view.js' */

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockRequest = /** @type {Request} */ ({})

/** @type {RegistrationView} */
const exporter = {
  material: 'paper',
  status: { current: 'approved' },
  wasteProcessingType: 'exporter',
  accreditations: {}
}

/** @type {RegistrationView} */
const reprocessor = {
  material: 'plastic',
  status: { current: 'cancelled' },
  wasteProcessingType: 'reprocessor',
  reprocessingType: 'input',
  site: {
    address: { line1: '1 Mill Lane', town: 'Leeds', postcode: 'LS1 1AA' }
  },
  accreditations: {
    2026: {
      accreditationNumber: 'A26ER5001180114PL',
      status: { current: 'approved' }
    }
  }
}

/**
 * @param {Record<string, RegistrationView>} registrations
 * @returns {OrganisationView}
 */
const organisationWith = (registrations) => ({
  name: 'ACME ltd',
  organisationNumber: '500123',
  registrations
})

describe(fetchOrganisationView, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads the organisation by its number, encoded once', async () => {
    const organisation = organisationWith({})
    vi.mocked(fetchJsonFromBackend).mockResolvedValue(organisation)

    const result = await fetchOrganisationView(mockRequest, 'FAKE/ORG')

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/organisations/FAKE%2FORG',
      {}
    )
    expect(result).toBe(organisation)
  })
})

describe(registrationIn, () => {
  const organisation = organisationWith({ R26ER5001180041PL: exporter })

  it('returns the registration the organisation holds', () => {
    expect(registrationIn(organisation, 'R26ER5001180041PL')).toBe(exporter)
  })

  it.each(['R26ER9999999999PL', 'constructor'])(
    'is not found for %s, which the organisation does not hold',
    (registrationNumber) => {
      expect(() => registrationIn(organisation, registrationNumber)).toThrow(
        expect.objectContaining({
          isBoom: true,
          output: expect.objectContaining({ statusCode: 404 }),
          code: 'registration_not_found',
          event: {
            action: 'fetch_registration',
            reason: `organisationNumber=500123 registrationNumber=${registrationNumber}`
          }
        })
      )
    }
  )
})

describe(latestAccreditation, () => {
  it('picks the latest year', () => {
    expect(
      latestAccreditation({
        ...reprocessor,
        accreditations: {
          2027: {
            accreditationNumber: 'A27ER5001180114PL',
            status: { current: 'suspended' }
          },
          2026: {
            accreditationNumber: 'A26ER5001180114PL',
            status: { current: 'approved' }
          }
        }
      })
    ).toStrictEqual({
      year: '2027',
      accreditationNumber: 'A27ER5001180114PL',
      status: 'suspended'
    })
  })

  it('is null when the registration has no accreditations', () => {
    expect(latestAccreditation(exporter)).toBeNull()
  })
})

describe(processingTypeOf, () => {
  it('names an exporter', () => {
    expect(processingTypeOf(exporter)).toBe('exporter')
  })

  it('names a reprocessor with its reprocessing type', () => {
    expect(processingTypeOf(reprocessor)).toBe('reprocessor - input')
  })
})

describe(siteOf, () => {
  it('reads the first line of a reprocessor address', () => {
    expect(siteOf(reprocessor)).toBe('1 Mill Lane')
  })

  it('reads a reprocessor address given in full', () => {
    expect(
      siteOf({
        ...reprocessor,
        site: { address: { fullAddress: '1 Mill Lane, Leeds, LS1 1AA' } }
      })
    ).toBe('1 Mill Lane, Leeds, LS1 1AA')
  })

  it('is null for an exporter', () => {
    expect(siteOf(exporter)).toBeNull()
  })
})

describe(registrationRows, () => {
  it('lists the registrations by number, whatever order they arrive in', () => {
    const rows = registrationRows(
      organisationWith({
        R26ER5001180042PL: reprocessor,
        R26ER5001180041PL: exporter
      })
    )

    expect(rows).toStrictEqual([
      {
        registrationNumber: 'R26ER5001180041PL',
        status: 'approved',
        processingType: 'exporter',
        material: 'paper',
        site: null,
        accreditation: null
      },
      {
        registrationNumber: 'R26ER5001180042PL',
        status: 'cancelled',
        processingType: 'reprocessor - input',
        material: 'plastic',
        site: '1 Mill Lane',
        accreditation: {
          year: '2026',
          accreditationNumber: 'A26ER5001180114PL',
          status: 'approved'
        }
      }
    ])
  })
})
