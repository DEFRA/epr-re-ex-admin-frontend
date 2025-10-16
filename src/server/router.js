import inert from '@hapi/inert'

import { home } from './routes/home/index.js'
import { about } from './routes/about/index.js'
import { health } from './routes/health/index.js'
import auth from './routes/auth/index.js'
import { protectedRoute } from './routes/protected/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { data as backendData } from './routes/backend/data/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      // auth must be registered first as this adds the authentication strategies used to guard other routes
      await server.register([auth, home, about, protectedRoute, backendData])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
