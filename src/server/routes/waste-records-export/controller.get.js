import { fetchWasteRecordYears } from '#server/common/helpers/fetch-waste-record-years.js'

export const wasteRecordsExportGetController = {
  async handler(request, h) {
    const error = request.yar.get('error')
    await request.yar.clear('error')

    const years = await fetchWasteRecordYears(request)
    const currentYear = String(new Date().getUTCFullYear())

    return h.view('routes/waste-records-export/index', {
      pageTitle: 'Waste records export',
      yearItems: years.map((year) => ({
        value: year,
        text: year,
        selected: year === currentYear
      })),
      error
    })
  }
}
