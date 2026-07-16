import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { mapCreditedTonnageRow } from './formatters.js'

export const creditedTonnageGetController = {
  async handler(request, h) {
    const error = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(
      request,
      '/v1/admin/waste-balances/credited-tonnage'
    )

    const rows = data.data.map(mapCreditedTonnageRow)

    return h.view('routes/credited-tonnage/index', {
      pageTitle: 'Tonnage credited to waste balances',
      generatedAt: data.meta.generatedAt,
      rows,
      error
    })
  }
}
