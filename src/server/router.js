import inert from '@hapi/inert'

import { health } from './routes/health/index.js'

import { home } from './routes/home/index.js'
import { about } from './routes/about/index.js'
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
      await server.register([home, about, auth])

      await server.register([serveStaticFiles])
    }
  }
}
