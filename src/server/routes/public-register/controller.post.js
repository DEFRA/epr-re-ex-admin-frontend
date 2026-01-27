import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const publicRegisterPostController = {
  async handler(request, h) {
    try {
      const response = await fetchJsonFromBackend(
        request,
        '/v1/public-register/generate',
        { method: 'POST' }
      )

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
