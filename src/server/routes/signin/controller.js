/**
 * A generic health-check endpoint. Used by the platform to check if the service is up and handling requests.
 */
export const signinController = {
  handler(_request, h) {
    return h.redirect('/home')
  }
}
