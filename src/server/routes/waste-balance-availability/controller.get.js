import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  defaultReportYear,
  reportUrlForYear,
  reportYears,
  yearItems
} from '#server/common/helpers/report-year.js'
import { formatMaterialName, formatAmount } from './formatters.js'

export const wasteBalanceAvailabilityPath = '/waste-balance-availability'

export const wasteBalanceAvailabilityGetController = {
  async handler(request, h) {
    const { years, year } = await reportYears(request)
    if (year === undefined) {
      return h.redirect(
        reportUrlForYear(wasteBalanceAvailabilityPath, defaultReportYear(years))
      )
    }

    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(
      request,
      `/v1/waste-balance-availability?year=${year}`
    )

    const materials = data.materials.map((item) => ({
      material: formatMaterialName(item.material),
      availableAmount: formatAmount(item.availableAmount)
    }))

    return h.view('routes/waste-balance-availability/index', {
      pageTitle: request.route.settings.app.pageTitle,
      generatedAt: data.generatedAt,
      year,
      yearItems: yearItems({ years, year }),
      materials,
      total: formatAmount(data.total),
      error: errorMessage
    })
  }
}
