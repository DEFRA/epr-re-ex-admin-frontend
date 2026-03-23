import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { config } from '#config/config.js'
import isEqual from 'lodash/isEqual.js'
import isArray from 'lodash/isArray.js'
import isObject from 'lodash/isObject.js'

export const systemLogGetController = {
  async handler(request, h) {
    const hasReferenceNumberQuery = Object.hasOwn(
      request.query,
      'referenceNumber'
    )
    const searchTermReferenceNumber =
      request.query?.referenceNumber?.trim?.() ?? request.query?.referenceNumber
    const cursor = request.query?.cursor || null
    const page = Number(request.query?.page) || 1

    if (hasReferenceNumberQuery && !searchTermReferenceNumber) {
      return h.view('routes/system-logs/index', {
        pageTitle: request.route.settings.app.pageTitle,
        systemLogs: [],
        searchTerms: {
          referenceNumber: ''
        },
        error: {
          text: 'Enter an organisation reference number',
          href: '#referenceNumber'
        },
        pagination: {},
        page: 1,
        showFileDownload: config.get('featureFlags.summaryLogFileDownload')
      })
    }

    const params = new URLSearchParams({
      organisationId: searchTermReferenceNumber
    })

    if (cursor) {
      params.set('cursor', cursor)
    }

    const data = await fetchJsonFromBackend(
      request,
      `/v1/system-logs?${params.toString()}`
    )

    const pagination = buildPagination({
      data,
      referenceNumber: searchTermReferenceNumber,
      cursor,
      page
    })

    return h.view('routes/system-logs/index', {
      pageTitle: request.route.settings.app.pageTitle,
      systemLogs: data.systemLogs.map((systemLog) => ({
        timestamp: systemLog.createdAt,
        event: systemLog.event,
        user: systemLog.createdBy,
        ...contextWithDeltaBetweenPreviousAndNextExtracted(systemLog)
      })),
      searchTerms: {
        referenceNumber: searchTermReferenceNumber
      },
      error: null,
      pagination,
      page,
      showFileDownload: config.get('featureFlags.summaryLogFileDownload')
    })
  }
}

function buildPagination({ data, referenceNumber, cursor, page }) {
  const pagination = {}

  if (data?.hasMore && data?.nextCursor) {
    const nextParams = new URLSearchParams({
      referenceNumber,
      cursor: data.nextCursor,
      page: String(page + 1)
    })

    pagination.next = {
      href: `/system-logs?${nextParams.toString()}`
    }
  }

  if (cursor && page > 1) {
    const prevParams = new URLSearchParams({ referenceNumber })

    pagination.previous = {
      href: `/system-logs?${prevParams.toString()}`
    }
  }

  return pagination
}

function contextWithDeltaBetweenPreviousAndNextExtracted({ context }) {
  const { previous, next, ...remainingContext } = context
  if ('previous' in context && 'next' in context) {
    return {
      renderDelta: {
        previous,
        next,
        difference: difference(previous, next) || 'no differences'
      },
      context: { ...remainingContext }
    }
  }

  return { context }
}

function difference(previous, next) {
  if (isEqual(previous, next)) {
    return undefined
  }
  if (isSimple(previous) || isSimple(next)) {
    return renderChange(previous, next)
  }

  const allKeysDeDuped = [...new Set([previous, next].flatMap(Object.keys))]
  return allKeysDeDuped.reduce((acc, key) => {
    const diff = difference(previous[key], next[key])
    if (diff) {
      acc[key] = diff
    }
    return acc
  }, {})
}

function renderChange(a, b) {
  if (isSimple(a) && isSimple(b)) {
    if (!a) {
      return { _added: b }
    }
    if (!b) {
      return { _removed: a }
    }
    return { _changed: `${a} -> ${b}` }
  }

  if (!a) {
    return { _added: b }
  }

  if (!b) {
    return { _removed: a }
  }

  return { _previous: a, _next: b }
}

function isSimple(x) {
  return x === undefined || x === null || (!isObject(x) && !isArray(x))
}
