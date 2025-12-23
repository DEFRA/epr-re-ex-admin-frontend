import { metrics } from '#server/common/helpers/metrics/index.js'

export default {
  method: 'GET',
  path: '/auth/sign-in',
  options: {
    ext: {
      onPreAuth: {
        method: (_request, h) => {
          metrics.signInAttempted()
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
