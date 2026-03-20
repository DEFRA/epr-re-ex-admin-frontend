import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

function toDisplayValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value
}

function mapSiteRows(rows = []) {
  return rows.map((row) => ({
    orsId: toDisplayValue(row.orsId),
    destinationCountry: toDisplayValue(row.destinationCountry),
    overseasReprocessorName: toDisplayValue(row.overseasReprocessorName),
    addressLine1: toDisplayValue(row.addressLine1),
    addressLine2: toDisplayValue(row.addressLine2),
    cityOrTown: toDisplayValue(row.cityOrTown),
    stateProvinceOrRegion: toDisplayValue(row.stateProvinceOrRegion),
    postcode: toDisplayValue(row.postcode),
    coordinates: toDisplayValue(row.coordinates),
    validFrom: row.validFrom ?? null
  }))
}

export const orsListGetController = {
  async handler(request, h) {
    try {
      const rows = await fetchJsonFromBackend(
        request,
        '/v1/admin/overseas-sites'
      )

      return h.view('routes/ors-upload/list', {
        pageTitle: request.route.settings.app.pageTitle,
        rows: mapSiteRows(rows),
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
        error:
          'There was a problem loading overseas reprocessing site data. Please try again.'
      })
    }
  }
}
