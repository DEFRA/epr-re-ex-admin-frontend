export default {
  method: 'GET',
  path: '/auth/sign-in',
  options: {
    ext: {
      onPreAuth: {
        method: async (request, h) => {
          await request.metrics.counter('signInAttempted')
          return h.continue
        }
      }
    },
    auth: 'entra-id'
  },
  handler(_request, h) {
    return h.view('unauthorised')
  }
}
