import { fetchJson } from '../auth/fetch-json.js'
import { config } from '../../../config/config.js'
import { getUserSession } from '../auth/index.js'

export const protectedRoute = {
  plugin: {
    name: 'protected',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/protected',
          async handler(request, h) {
            const endpoint = `${config.get('appBaseUrl')}/backend/data`

            const accessToken = (await getUserSession(request)).token

            const { payload } = await fetchJson(endpoint, {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            })

            return h.view('routes/protected/index', {
              pageTitle: 'Protected',
              heading: 'Protected',
              data: payload
            })
          },
          options: {
            // auth: false // auth not required (disables default scheme for this route)
            // auth: 'strategy-name' // uses the named strategy in "required" mode
            auth: {
              strategy: 'session', // only allow access to this page if the 'session' auth strategy is satisfied (ie a session cookie exists with a session ID, and session data exists in the cache for that ID)
              mode: 'required'
            }
          }
        }
      ])
    }
  }
}
