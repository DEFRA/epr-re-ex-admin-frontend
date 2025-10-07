import inert from '@hapi/inert'

import { home } from './routes/home/index.js'
import { about } from './routes/about/index.js'
import { signin } from './routes/signin/index.js'
import { signout } from './routes/signout/index.js'
import { health } from './routes/health/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // TODO: Remove about once we have any useful routes
      //
      // Application specific routes, add your own routes here
      await server.register([home, about, signin, signout])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
