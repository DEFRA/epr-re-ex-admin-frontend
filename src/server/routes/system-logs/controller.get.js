import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { transformSystemLog } from './transform-system-log.js'

export const systemLogGetController = {
  async handler(request, h) {
    const hasReferenceNumberQuery = Object.hasOwn(
      request.query,
      'referenceNumber'
    )
    const rawRef = request.query?.referenceNumber
    const searchTermReferenceNumber =
      typeof rawRef === 'string' ? rawRef.trim() : ''
    const cursor = request.query?.cursor || null
    const page = Number(request.query?.page) || 1

    if (!searchTermReferenceNumber) {
      return h.view('routes/system-logs/index', {
        pageTitle: request.route.settings.app.pageTitle,
        systemLogs: [],
        searchTerms: {
          referenceNumber: '',
          email: '',
          subCategory: ''
        },
        error: hasReferenceNumberQuery
          ? {
              text: 'Enter an organisation reference number',
              href: '#referenceNumber'
            }
          : null,
        pagination: {},
        page: 1
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
      systemLogs: data.systemLogs.map(transformSystemLog),
      searchTerms: {
        referenceNumber: searchTermReferenceNumber,
        email: '',
        subCategory: ''
      },
      error: null,
      pagination,
      page
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
