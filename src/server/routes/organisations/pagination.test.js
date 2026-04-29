import { buildPaginationLinks } from './pagination.js'

describe('buildPaginationLinks', () => {
  describe('when there is at most one page of results', () => {
    it('returns an empty object when totalPages is 0', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 0,
        searchTerm: ''
      })

      expect(result).toEqual({})
    })

    it('returns an empty object when totalPages is 1', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 1,
        searchTerm: ''
      })

      expect(result).toEqual({})
    })
  })

  describe('when on the first page of multiple', () => {
    it('returns only a next link', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 3,
        searchTerm: ''
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
        searchTerm: ''
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
        searchTerm: ''
      })

      expect(result).toEqual({
        previous: { href: '/organisations?page=2' }
      })
    })
  })

  describe('search term inclusion', () => {
    it('includes the search term in both links when provided', () => {
      const result = buildPaginationLinks({
        page: 2,
        totalPages: 3,
        searchTerm: 'acme'
      })

      expect(result.previous.href).toBe('/organisations?search=acme&page=1')
      expect(result.next.href).toBe('/organisations?search=acme&page=3')
    })

    it('omits the search term from links when empty string', () => {
      const result = buildPaginationLinks({
        page: 2,
        totalPages: 3,
        searchTerm: ''
      })

      expect(result.previous.href).toBe('/organisations?page=1')
      expect(result.next.href).toBe('/organisations?page=3')
    })

    it('omits the search term from links when undefined', () => {
      const result = buildPaginationLinks({
        page: 2,
        totalPages: 3,
        searchTerm: undefined
      })

      expect(result.previous.href).toBe('/organisations?page=1')
      expect(result.next.href).toBe('/organisations?page=3')
    })
  })

  describe('URL encoding of the search term', () => {
    it('encodes spaces using + (application/x-www-form-urlencoded)', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 2,
        searchTerm: 'acme corp'
      })

      expect(result.next.href).toBe('/organisations?search=acme+corp&page=2')
    })

    it('encodes reserved URL characters', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 2,
        searchTerm: 'a&b=c?'
      })

      expect(result.next.href).toBe('/organisations?search=a%26b%3Dc%3F&page=2')
    })

    it('encodes unicode characters', () => {
      const result = buildPaginationLinks({
        page: 1,
        totalPages: 2,
        searchTerm: 'café'
      })

      expect(result.next.href).toBe('/organisations?search=caf%C3%A9&page=2')
    })
  })
})
