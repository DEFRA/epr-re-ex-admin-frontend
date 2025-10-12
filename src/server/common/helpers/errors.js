import { statusCodes } from '../constants/status-codes.js'

export function catchAll(request, h) {
  const { response } = request

  // If the response is not an error, there's nothing to do here
  if (!('isBoom' in response)) {
    return h.continue
  }

  const statusCode = response.output.statusCode

  let template = '500'

  switch (statusCode) {
    case statusCodes.unauthorised:
      template = 'unauthorised'
      break
    case statusCodes.forbidden:
      template = '403'
      break
    case statusCodes.notFound:
      template = '404'
      break
    case statusCodes.internalServerError:
    default:
      break
  }

  // TODO: Think what other types of errors we may want to log
  if (statusCode >= statusCodes.internalServerError) {
    request.log(['error'], {
      statusCode,
      message: response.message,
      stack: response.data?.stack
    })
  }

  // Copy all headers from the original response except content-type
  // since the view will set its own content-type
  const viewResponse = h.view(template).code(statusCode)

  const originalHeaders = response.headers || response.output?.headers || {}
  for (const [key, value] of Object.entries(originalHeaders)) {
    if (key.toLowerCase() === 'content-type') {
      continue
    }
    viewResponse.header(key, value)
  }

  return viewResponse
}
