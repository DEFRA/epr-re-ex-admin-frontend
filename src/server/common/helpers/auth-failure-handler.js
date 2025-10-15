import { statusCodes } from '#server/common/constants/status-codes.js'

export function handleAuthFailure(request, h) {
  const { response } = request

  if (!('isBoom' in response)) {
    return h.continue
  }

  // Handle 401 Unauthorized responses from cookie authentication
  if (response.output.statusCode === statusCodes.unauthorised) {
    return h.view('views/unauthorised').code(statusCodes.unauthorised)
  }

  return h.continue
}
