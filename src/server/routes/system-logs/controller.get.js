import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { transformSystemLog } from './transform-system-log.js'

const FILTER_KEYS = ['referenceNumber', 'userId', 'subCategory']

export const systemLogGetController = {
  async handler(request, h) {
    const query = request.query

    const searchTerms = normaliseSearchTerms(query)
    const cursor = query.cursor || ''
    const direction = query.direction === 'prev' ? 'prev' : 'next'

    const hasFilter = FILTER_KEYS.some((key) => searchTerms[key])
    const wasSubmitted = FILTER_KEYS.some((key) => Object.hasOwn(query, key))

    if (!hasFilter) {
      return h.view('routes/system-logs/index', {
        pageTitle: request.route.settings.app.pageTitle,
        systemLogs: [],
        searchTerms,
        error: wasSubmitted
          ? {
              text: 'Enter an organisation reference number, user ID or event type',
              href: '#referenceNumber'
            }
          : null,
        pagination: {}
      })
    }

    const backendParams = buildBackendParams(searchTerms, cursor, direction)

    const data = await fetchJsonFromBackend(
      request,
      `/v1/system-logs/search?${backendParams}`,
      { method: 'GET' }
    )

    return h.view('routes/system-logs/index', {
      pageTitle: request.route.settings.app.pageTitle,
      systemLogs: data.systemLogs.map(transformSystemLog),
      searchTerms,
      error: null,
      pagination: buildPagination(data, searchTerms)
    })
  }
}

/**
 * @param {Record<string, string>} query
 * @returns {{ referenceNumber: string, userId: string, subCategory: string }}
 */
function normaliseSearchTerms(query) {
  return {
    referenceNumber: (query.referenceNumber ?? '').trim(),
    userId: (query.userId ?? '').trim(),
    subCategory: (query.subCategory ?? '').trim()
  }
}

/**
 * @param {{ referenceNumber: string, userId: string, subCategory: string }} searchTerms
 * @param {string} cursor
 * @param {'next' | 'prev'} direction
 * @returns {URLSearchParams}
 */
function buildBackendParams(searchTerms, cursor, direction) {
  const params = new URLSearchParams()
  if (searchTerms.referenceNumber) {
    params.set('organisationId', searchTerms.referenceNumber)
  }
  if (searchTerms.userId) {
    params.set('userId', searchTerms.userId)
  }
  if (searchTerms.subCategory) {
    params.set('subCategory', searchTerms.subCategory)
  }
  if (cursor) {
    params.set('cursor', cursor)
    params.set('direction', direction)
  }
  return params
}

/**
 * @param {{
 *   hasNext?: boolean, hasPrev?: boolean,
 *   nextCursor?: string, prevCursor?: string
 * }} data
 * @param {{ referenceNumber: string, userId: string, subCategory: string }} searchTerms
 * @returns {{ next?: { href: string }, previous?: { href: string } }}
 */
function buildPagination(data, searchTerms) {
  const link = (cursor, direction) => {
    const params = new URLSearchParams()
    if (searchTerms.referenceNumber) {
      params.set('referenceNumber', searchTerms.referenceNumber)
    }
    if (searchTerms.userId) {
      params.set('userId', searchTerms.userId)
    }
    if (searchTerms.subCategory) {
      params.set('subCategory', searchTerms.subCategory)
    }
    params.set('cursor', cursor)
    params.set('direction', direction)
    return { href: `/system-logs?${params}` }
  }

  const pagination = {}
  if (data?.hasNext && data?.nextCursor) {
    pagination.next = link(data.nextCursor, 'next')
  }
  if (data?.hasPrev && data?.prevCursor) {
    pagination.previous = link(data.prevCursor, 'prev')
  }
  return pagination
}
