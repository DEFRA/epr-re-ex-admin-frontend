import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const queueManagementPostController = {
  async handler(request, h) {
    try {
      await fetchJsonFromBackend(request, '/v1/admin/queues/dlq/purge', {
        method: 'POST'
      })

      request.yar.set('success', true)
    } catch (error) {
      request.logger.error({
        err: error,
        message: 'DLQ purge failed; redirecting anyway'
      })
    }

    return h.redirect('/queue-management')
  }
}
