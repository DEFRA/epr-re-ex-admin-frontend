import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()
const defaultPageSize = 50

function buildPageHref(page, pageSize) {
  return `/overseas-sites?page=${page}&pageSize=${pageSize}`
}

function toDisplayValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value
}

function toValidFromDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  try {
    return formatDate(value, 'd MMMM yyyy')
  } catch {
    return '-'
  }
}

function mapSiteRows(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : []

  return safeRows.map((row) => ({
    orsId: toDisplayValue(row.orsId),
    packagingWasteCategory: toDisplayValue(row.packagingWasteCategory),
    orgId: toDisplayValue(row.orgId),
    registrationNumber: toDisplayValue(row.registrationNumber),
    accreditationNumber: toDisplayValue(row.accreditationNumber),
    destinationCountry: toDisplayValue(row.destinationCountry),
    overseasReprocessorName: toDisplayValue(row.overseasReprocessorName),
    addressLine1: toDisplayValue(row.addressLine1),
    addressLine2: toDisplayValue(row.addressLine2),
    cityOrTown: toDisplayValue(row.cityOrTown),
    stateProvinceOrRegion: toDisplayValue(row.stateProvinceOrRegion),
    postcode: toDisplayValue(row.postcode),
    coordinates: toDisplayValue(row.coordinates),
    validFromDisplay: toValidFromDisplayValue(row.validFrom)
  }))
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function buildPaginationItems({ page, totalPages, pageSize }) {
  const visiblePages = new Set([1, totalPages, page - 1, page, page + 1])
  const pageNumbers = Array.from(visiblePages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((left, right) => left - right)

  const items = []

  for (const [index, pageNumber] of pageNumbers.entries()) {
    if (index > 0 && pageNumber - pageNumbers[index - 1] > 1) {
      items.push({ ellipsis: true })
    }

    items.push({
      number: pageNumber,
      href: buildPageHref(pageNumber, pageSize),
      current: pageNumber === page
    })
  }

  return items
}

function buildPagination({ pagination, pageSize }) {
  const controls = {}

  if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) {
    return controls
  }

  if (pagination.hasPreviousPage) {
    controls.previous = {
      href: buildPageHref(pagination.page - 1, pageSize)
    }
  }

  if (pagination.hasNextPage) {
    controls.next = {
      href: buildPageHref(pagination.page + 1, pageSize)
    }
  }

  controls.items = buildPaginationItems({
    page: pagination.page,
    totalPages: pagination.totalPages,
    pageSize
  })

  return controls
}

export const orsListGetController = {
  async handler(request, h) {
    const page = toPositiveInteger(request.query?.page, 1)
    const pageSize = toPositiveInteger(request.query?.pageSize, defaultPageSize)

    try {
      const data = await fetchJsonFromBackend(
        request,
        `/v1/admin/overseas-sites?page=${page}&pageSize=${pageSize}`
      )

      const rowsPayload = Array.isArray(data) ? data : data?.rows
      const mappedRows = mapSiteRows(rowsPayload)
      const paginationData = Array.isArray(data)
        ? {
            page,
            pageSize,
            totalItems: mappedRows.length,
            totalPages: mappedRows.length ? 1 : 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        : data?.pagination

      return h.view('routes/ors-upload/list', {
        pageTitle: request.route.settings.app.pageTitle,
        rows: mappedRows,
        pagination: buildPagination({ pagination: paginationData, pageSize }),
        page: paginationData?.page ?? page,
        totalPages: paginationData?.totalPages ?? 0,
        error: null
      })
    } catch (error) {
      logger.error({
        err: error,
        message: 'Failed to fetch overseas reprocessing sites for admin view'
      })

      return h.view('routes/ors-upload/list', {
        pageTitle: request.route.settings.app.pageTitle,
        rows: [],
        pagination: {},
        page: 1,
        totalPages: 0,
        error:
          'There was a problem loading overseas reprocessing site data. Please try again.'
      })
    }
  }
}
