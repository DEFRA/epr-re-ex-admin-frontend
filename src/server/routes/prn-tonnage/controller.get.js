export const prnTonnageGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    return h.view('routes/prn-tonnage/index', {
      pageTitle: request.route.settings.app.pageTitle,
      error: errorMessage
    })
  }
}
