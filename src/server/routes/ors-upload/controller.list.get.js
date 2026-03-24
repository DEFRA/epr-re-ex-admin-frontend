import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

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

function buildPagination({ pagination, pageSize }) {
  const controls = {}

  if (!pagination) {
    return controls
  }

  if (pagination.hasPreviousPage) {
    controls.previous = {
      href: `/overseas-sites?page=${pagination.page - 1}&pageSize=${pageSize}`
    }
  }

  if (pagination.hasNextPage) {
    controls.next = {
      href: `/overseas-sites?page=${pagination.page + 1}&pageSize=${pageSize}`
    }
  }

  return controls
}

export const orsListGetController = {
  async handler(request, h) {
    const page = toPositiveInteger(request.query?.page, 1)
    const pageSize = toPositiveInteger(request.query?.pageSize, 50)

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
