import { fetchRedirectFromBackend } from '#server/common/helpers/fetch-redirect-from-backend.js'
import { summaryLogUrl } from '#server/common/helpers/page-urls.js'

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

export const summaryLogFileGetController = {
  async handler(request, h) {
    const { summaryLogId } = request.params

    // The page and the backend share the summary log's natural-key address.
    const downloadUrl = await fetchRedirectFromBackend(
      request,
      `${summaryLogUrl(request.params)}/file`
    )

    if (!isAllowedDownloadUrl(downloadUrl)) {
      throw new Error('Invalid download URL')
    }

    const fileResponse = await fetch(downloadUrl)

    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file from storage')
    }

    const fileContent = Buffer.from(await fileResponse.arrayBuffer())

    return h
      .response(fileContent)
      .header('Content-Type', 'application/octet-stream')
      .header(
        'Content-Disposition',
        `attachment; filename="${summaryLogId}.xlsx"`
      )
  }
}
