import { fetchRedirectFromBackend } from '#server/common/helpers/fetch-redirect-from-backend.js'

export const systemLogDownloadController = {
  async handler(request, h) {
    const { organisationId, registrationId, summaryLogId } = request.params

    const downloadUrl = await fetchRedirectFromBackend(
      request,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs/${summaryLogId}/download`
    )

    return h.redirect(downloadUrl).temporary()
  }
}
