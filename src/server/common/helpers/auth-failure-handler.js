export function handleAuthFailure(request, h) {
  const { response } = request

  if (!('isBoom' in response)) {
    return h.continue
  }

  // Handle 401 Unauthorized responses from cookie authentication
  if (response.output.statusCode === 401) {
    return h.view('views/unauthorised').code(401)
  }

  return h.continue
}
