/** @import { SearchCriteria } from './criteria.js'; */import { CRITERIA_KEYS } from './criteria.js'

export const PAGE_SIZE = 50

/**
 * Builds the previous/next links for the organisations table, carrying every
 * non-empty search criterion through so paging never widens the search.
 *
 * @param {{
  page: number,
  totalPages: number,
  criteria: Partial<SearchCriteria>
}}
 *   page: number,
 *   totalPages: number,
 *   criteria: Partial<import('./criteria.js').SearchCriteria>
 * }} params
 * @returns {{ previous?: { href: string }, next?: { href: string } }}
 */
export const buildPaginationLinks = ({ page, totalPages, criteria }) => {
  if (totalPages <= 1) {
    return {}
  }

  const linkFor = (n) => {
    const params = new URLSearchParams()

    for (const key of CRITERIA_KEYS) {
      if (criteria[key]) {
        params.set(key, criteria[key])
      }
    }

    params.set('page', String(n))

    return `/organisations?${params}`
  }

  const pagination = {}

  if (page > 1) {
    pagination.previous = { href: linkFor(page - 1) }
  }

  if (page < totalPages) {
    pagination.next = { href: linkFor(page + 1) }
  }

  return pagination
}
