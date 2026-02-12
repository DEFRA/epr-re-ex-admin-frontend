import { buildBackendPath, mapLinkedOrganisations } from './helpers.js'
import { mockLinkedOrg } from './test-fixtures.js'

describe('linked-organisations helpers', () => {
  describe('buildBackendPath', () => {
    test('Should return base path when no search term', () => {
      expect(buildBackendPath('')).toBe('/v1/linked-organisations')
    })

    test('Should append name query param when search term provided', () => {
      expect(buildBackendPath('acme')).toBe(
        '/v1/linked-organisations?name=acme'
      )
    })

    test('Should encode special characters in search term', () => {
      expect(buildBackendPath('Acme & Co')).toBe(
        '/v1/linked-organisations?name=Acme%20%26%20Co'
      )
    })
  })

  describe('mapLinkedOrganisations', () => {
    test('Should map backend response to view model', () => {
      const result = mapLinkedOrganisations([mockLinkedOrg])

      expect(result).toEqual([
        {
          eprOrgName: 'Acme Ltd',
          eprOrgId: 101,
          defraOrgName: 'Defra Org One',
          defraOrgId: 'defra-uuid-1',
          linkedAt: '2025-06-15T10:30:00.000Z',
          linkedByEmail: 'admin@defra.gov.uk'
        }
      ])
    })

    test('Should return empty array when data is not an array', () => {
      expect(mapLinkedOrganisations({})).toEqual([])
    })

    test('Should return empty array for empty array input', () => {
      expect(mapLinkedOrganisations([])).toEqual([])
    })
  })
})
