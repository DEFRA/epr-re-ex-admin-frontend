import { fetchRedirectFromBackend } from '#server/common/helpers/fetch-redirect-from-backend.js'

const ALLOWED_URL_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.s3\.[a-z0-9-]+\.amazonaws\.com\//,
  /^https:\/\/s3\.[a-z0-9-]+\.amazonaws\.com\//,
  /^https:\/\/[a-z0-9-]+\.s3\.amazonaws\.com\//,
  /^http:\/\/localhost:4566\//,
  /^http:\/\/floci:4566\//
]

function isAllowedDownloadUrl(url) {
  return ALLOWED_URL_PATTERNS.some((pattern) => pattern.test(url))
}

export const systemLogDownloadController = {
  async handler(request, h) {
    const { organisationId, registrationId, summaryLogId } = request.params

    const downloadUrl = await fetchRedirectFromBackend(
      request,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs/${summaryLogId}/file`
    )

    if (!isAllowedDownloadUrl(downloadUrl)) {
      throw new Error('Invalid download URL')
    }

    const fileResponse = await fetch(downloadUrl)

    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file from storage')
    }

    const fileContent = Buffer.from(await fileResponse.arrayBuffer())

    // The backend signs the URL with the name the operator uploaded, so that
    // is what the file is saved as. Older objects were signed before it did,
    // and fall back to the id.
    const disposition =
      fileResponse.headers.get('content-disposition') ??
      `attachment; filename="${summaryLogId}.xlsx"`

    return h
      .response(fileContent)
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', disposition)
  }
}
