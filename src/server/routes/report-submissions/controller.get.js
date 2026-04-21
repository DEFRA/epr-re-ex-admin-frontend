export const reportSubmissionsGetController = {
  async handler(request, h) {
    const error = request.yar.get('error')
    await request.yar.clear('error')

    return h.view('routes/report-submissions/index', {
      pageTitle: 'Report submissions',
      error
    })
  }
}
