import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

const ALLOWED_URL_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.s3\.[a-z0-9-]+\.amazonaws\.com\//,
  /^https:\/\/s3\.[a-z0-9-]+\.amazonaws\.com\//,
  /^https:\/\/[a-z0-9-]+\.s3\.amazonaws\.com\//,
  /^http:\/\/localhost:4566\//,
  /^http:\/\/localstack:4566\//
]

function isAllowedDownloadUrl(url) {
  return ALLOWED_URL_PATTERNS.some((pattern) => pattern.test(url))
}

export const publicRegisterPostController = {
  async handler(request, h) {
    try {
      const response = await fetchJsonFromBackend(
        request,
        '/v1/public-register/generate',
        { method: 'POST' }
      )

      if (!isAllowedDownloadUrl(response.downloadUrl)) {
        throw new Error('Invalid download URL')
      }

      const fileResponse = await fetch(response.downloadUrl)

      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file from storage')
      }

      const fileContent = await fileResponse.text()
      const filename = 'public-register.csv'

      return h
        .response(fileContent)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem generating the public register. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/public-register')
    }
  }
}
