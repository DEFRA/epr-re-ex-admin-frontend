import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import {
  toDisplayValue,
  toValidFromDisplayValue
} from '#server/common/helpers/overseas-site-display.js'
import {
  buildBackendPath,
  buildPageHref,
  defaultPageSize,
  normaliseRegistrationNumber
} from './helpers.js'
import { orsUploadRoutes } from './constants.js'
import {
  defaultReportYear,
  reportUrlForYear,
  reportYears,
  yearItems
} from '#server/common/helpers/report-year.js'

const logger = createLogger()

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

function buildUrlQueryItems({
  page,
  totalPages,
  pageSize,
  registrationNumber,
  year
}) {
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
      href: buildPageHref({
        page: pageNumber,
        pageSize,
        registrationNumber,
        year
      }),
      current: pageNumber === page
    })
  }

  return items
}

function buildUrlQuery({ pagination, pageSize, registrationNumber, year }) {
  const controls = {}
  const totalPages = pagination?.totalPages ?? 0

  if (totalPages <= 1) {
    return controls
  }

  if (pagination.hasPreviousPage) {
    controls.previous = {
      href: buildPageHref({
        page: pagination.page - 1,
        pageSize,
        registrationNumber,
        year
      })
    }
  }

  if (pagination.hasNextPage) {
    controls.next = {
      href: buildPageHref({
        page: pagination.page + 1,
        pageSize,
        registrationNumber,
        year
      })
    }
  }

  controls.items = buildUrlQueryItems({
    page: pagination.page,
    totalPages,
    pageSize,
    registrationNumber,
    year
  })

  return controls
}

export const orsListGetController = {
  async handler(request, h) {
    const page = toPositiveInteger(request.query?.page, 1)
    const pageSize = toPositiveInteger(request.query?.pageSize, defaultPageSize)
    const registrationNumber = normaliseRegistrationNumber(
      request.query?.registrationNumber
    )
    /** @type {{ year: string | undefined, yearItems: ReturnType<typeof yearItems> }} */
    let yearView = { year: undefined, yearItems: [] }

    try {
      const { years, year } = await reportYears(request)
      if (year === undefined) {
        return h.redirect(
          reportUrlForYear(orsUploadRoutes.list, defaultReportYear(years))
        )
      }
      yearView = { year, yearItems: yearItems({ years, year }) }

      const data = await fetchJsonFromBackend(
        request,
        buildBackendPath({ year, page, pageSize, registrationNumber })
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
        ...yearView,
        rows: mappedRows,
        pagination: buildUrlQuery({
          pagination: paginationData,
          pageSize,
          registrationNumber,
          year
        }),
        page: paginationData?.page ?? page,
        totalPages: paginationData?.totalPages ?? 0,
        registrationNumber,
        error: null
      })
    } catch (error) {
      logger.error({
        err: error,
        message: 'Failed to fetch overseas reprocessing sites for admin view'
      })

      return h.view('routes/ors-upload/list', {
        pageTitle: request.route.settings.app.pageTitle,
        ...yearView,
        rows: [],
        pagination: {},
        page: 1,
        totalPages: 0,
        registrationNumber,
        error:
          'There was a problem loading overseas reprocessing site data. Please try again.'
      })
    }
  }
}
