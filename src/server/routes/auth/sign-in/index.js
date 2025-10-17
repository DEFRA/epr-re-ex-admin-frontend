export default {
  method: 'GET',
  path: '/auth/sign-in',
  options: {
    auth: 'entra-id'
  },
  handler(_request, h) {
    return h.view('unauthorised')
  }
}
