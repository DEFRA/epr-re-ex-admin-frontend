export const publicRegisterGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const pageTitle = request.route.settings.app.pageTitle

    const viewContext = {
      pageTitle,
      heading: 'Public register'
    }

    if (errorMessage) {
      viewContext.error = errorMessage
    }

    return h.view('routes/public-register/index', viewContext)
  }
}
