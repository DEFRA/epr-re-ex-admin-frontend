import {
  buildBackendPath,
  buildPageHref,
  defaultPageSize,
  normaliseRegistrationNumber
} from './helpers.js'

describe('ors-upload helpers', () => {
  describe('normaliseRegistrationNumber', () => {
    test('Should trim string values', () => {
      expect(normaliseRegistrationNumber('  REG-123  ')).toBe('REG-123')
    })

    test('Should return empty string for non-string values', () => {
      expect(normaliseRegistrationNumber(undefined)).toBe('')
    })
  })

  describe('buildBackendPath', () => {
    test('Should build paginated backend path by default', () => {
      expect(buildBackendPath({ year: '2026' })).toBe(
        `/v1/admin/overseas-sites?year=2026&page=1&pageSize=${defaultPageSize}`
      )
    })

    test('Should include registrationNumber when provided', () => {
      expect(
        buildBackendPath({
          year: '2026',
          page: 2,
          pageSize: 10,
          registrationNumber: 'REG-123'
        })
      ).toBe(
        '/v1/admin/overseas-sites?year=2026&page=2&pageSize=10&registrationNumber=REG-123'
      )
    })

    test('Should build all=true backend path for downloads', () => {
      expect(
        buildBackendPath({
          year: '2026',
          all: true,
          registrationNumber: 'REG-123'
        })
      ).toBe(
        '/v1/admin/overseas-sites?year=2026&all=true&registrationNumber=REG-123'
      )
    })
  })

  describe('buildPageHref', () => {
    test('Should build pagination href without registrationNumber', () => {
      expect(buildPageHref({ year: '2026', page: 2, pageSize: 10 })).toBe(
        '/overseas-sites?year=2026&page=2&pageSize=10'
      )
    })

    test('Should preserve registrationNumber in pagination href', () => {
      expect(
        buildPageHref({
          year: '2026',
          page: 2,
          pageSize: 10,
          registrationNumber: 'REG-123'
        })
      ).toBe(
        '/overseas-sites?year=2026&page=2&pageSize=10&registrationNumber=REG-123'
      )
    })
  })
})
