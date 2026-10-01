import { metrics } from '#server/common/helpers/metrics/index.js'

export default {
  method: 'GET',
  path: '/auth/sign-in',
  options: {
    ext: {
      onPreAuth: {
        method: async (_request, h) => {
          await metrics.signIn.attempted()
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
