import { buildPaginationLinks } from './pagination.js'

const noCriteria = {
  search: '',
  organisationNumber: '',
  registrationNumber: '',
  accreditationNumber: ''
}

describe('buildPaginationLinks', () => {
  describe('when there is at most one page of results', () => {
    it('returns an empty object when totalPages is 0', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 0,
        criteria: noCriteria
      })

      expect(result).toEqual({})
    })

    it('returns an empty object when totalPages is 1', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 1,
        criteria: noCriteria
      })

      expect(result).toEqual({})
    })
  })

  describe('when on the first page of multiple', () => {
    it('returns only a next link', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 3,
        criteria: noCriteria
      })

      expect(result).toEqual({
        next: { href: '/organisations?page=2' }
      })
    })
  })

  describe('when in the middle of the range', () => {
    it('returns both previous and next links', () => {
      const result = buildPaginationLinks({
        page: 5,
        totalPages: 10,
        criteria: noCriteria
      })

      expect(result).toEqual({
        previous: { href: '/organisations?page=4' },
        next: { href: '/organisations?page=6' }
      })
    })
  })

  describe('when on the last page of multiple', () => {
    it('returns only a previous link', () => {
      const result = buildPaginationLinks({
        page: 3,
        totalPages: 3,
        criteria: noCriteria
      })

      expect(result).toEqual({
        previous: { href: '/organisations?page=2' }
      })
    })
  })

  describe('criteria inclusion', () => {
    it('includes the organisation name search in both links when provided', () => {
      const result = buildPaginationLinks({
        page: 2,
        totalPages: 3,
        criteria: { ...noCriteria, search: 'acme' }
      })

      expect(result).toEqual({
        previous: { href: '/organisations?search=acme&page=1' },
        next: { href: '/organisations?search=acme&page=3' }
      })
    })

    it('includes a criterion other than the organisation name search', () => {
      const result = buildPaginationLinks({
        page: 2,
        totalPages: 3,
        criteria: { ...noCriteria, accreditationNumber: 'ACC444' }
      })

      expect(result).toEqual({
        previous: { href: '/organisations?accreditationNumber=ACC444&page=1' },
        next: { href: '/organisations?accreditationNumber=ACC444&page=3' }
      })
    })

    it('includes every non-empty criterion in both links, in form order', () => {
      const result = buildPaginationLinks({
        page: 2,
        totalPages: 3,
        criteria: {
          search: 'acme',
          organisationNumber: '100001',
          registrationNumber: 'REG001',
          accreditationNumber: 'ACC001'
        }
      })

      const expectedCriteria =
        'search=acme&organisationNumber=100001&registrationNumber=REG001' +
        '&accreditationNumber=ACC001'
      expect(result).toEqual({
        previous: { href: `/organisations?${expectedCriteria}&page=1` },
        next: { href: `/organisations?${expectedCriteria}&page=3` }
      })
    })

    it('keeps the criteria it was given alongside the page number when only some are filled', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 2,
        criteria: {
          ...noCriteria,
          organisationNumber: '100001',
          registrationNumber: 'REG001'
        }
      })

      expect(result).toEqual({
        next: {
          href: '/organisations?organisationNumber=100001&registrationNumber=REG001&page=2'
        }
      })
    })

    it('omits criteria from links when all are empty strings', () => {
      const result = buildPaginationLinks({
        page: 2,
        totalPages: 3,
        criteria: noCriteria
      })

      expect(result).toEqual({
        previous: { href: '/organisations?page=1' },
        next: { href: '/organisations?page=3' }
      })
    })

    it('omits criteria from links when the values are undefined', () => {
      const result = buildPaginationLinks({
        page: 2,
        totalPages: 3,
        criteria: {}
      })

      expect(result).toEqual({
        previous: { href: '/organisations?page=1' },
        next: { href: '/organisations?page=3' }
      })
    })
  })

  describe('URL encoding of criteria values', () => {
    it('encodes spaces using + (application/x-www-form-urlencoded)', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 2,
        criteria: { ...noCriteria, search: 'acme corp' }
      })

      expect(result).toEqual({
        next: { href: '/organisations?search=acme+corp&page=2' }
      })
    })

    it('encodes reserved URL characters', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 2,
        criteria: { ...noCriteria, search: 'a&b=c?' }
      })

      expect(result).toEqual({
        next: { href: '/organisations?search=a%26b%3Dc%3F&page=2' }
      })
    })

    it('encodes unicode characters', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 2,
        criteria: { ...noCriteria, search: 'café' }
      })

      expect(result).toEqual({
        next: { href: '/organisations?search=caf%C3%A9&page=2' }
      })
    })
  })
})
