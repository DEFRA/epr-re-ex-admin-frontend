import inert from '@hapi/inert'

import { home } from './routes/home/index.js'
import { organisations } from './routes/organisations/index.js'
import { organisation } from './routes/organisation/index.js'
import { health } from './routes/health/index.js'
import { auth } from './routes/auth/index.js'

import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      await server.register([health])

      // These are the routes containing our application logic
      // Some routes contain nested routes
      await server.register([home, organisations, organisation, auth])

      await server.register([serveStaticFiles])
    }
  }
}
