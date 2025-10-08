export default {
  method: 'GET',
  path: '/auth/signin',
  options: {
    auth: 'entra-id'
  },
  handler(_request, h) {
    return h.view('unauthorised')
  }
}
