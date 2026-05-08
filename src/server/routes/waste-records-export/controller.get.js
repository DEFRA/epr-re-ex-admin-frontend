export const wasteRecordsExportGetController = {
  async handler(request, h) {
    const error = request.yar.get('error')
    await request.yar.clear('error')

    return h.view('routes/waste-records-export/index', {
      pageTitle: 'Waste records export',
      error
    })
  }
}
