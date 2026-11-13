import { exportYears } from './export-years.js'

export const wasteRecordsExportGetController = {
  async handler(request, h) {
    const error = request.yar.get('error')
    await request.yar.clear('error')

    const years = exportYears()

    return h.view('routes/waste-records-export/index', {
      pageTitle: 'Waste records export',
      yearItems: years.map((year) => ({
        value: year,
        text: year,
        selected: year === years.at(-1)
      })),
      error
    })
  }
}
