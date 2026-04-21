import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const queueManagementGetController = {
  async handler(request, h) {
    const data = await fetchJsonFromBackend(
      request,
      '/v1/admin/queues/dlq/status',
      {}
    )

    const success = request.yar.get('success')
    await request.yar.clear('success')

    const pageTitle = request.route.settings.app.pageTitle

    const viewContext = {
      pageTitle,
      heading: 'Queue management',
      approximateMessageCount: data.approximateMessageCount
    }

    if (success) {
      viewContext.success = true
    }

    return h.view('routes/queue-management/index', viewContext)
  }
}
