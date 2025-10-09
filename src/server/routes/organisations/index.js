import { organisationsController } from './controller.js'

/**
 * Sets up the routes used in the /about page.
 * These routes are registered in src/server/router.js.
 */
export const organisations = {
  plugin: {
    name: 'about',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/about',
          options: {
            auth: false
          },
          ...organisationsController
        }
      ])
    }
  }
}
