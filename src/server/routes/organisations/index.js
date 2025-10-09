import { organisationsController } from './controller.js'

/**
 * Sets up the routes used in the /organisations page.
 * These routes are registered in src/server/router.js.
 */
export const organisations = {
  plugin: {
    name: 'organisations',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations',
          options: {
            auth: false
          },
          ...organisationsController
        }
      ])
    }
  }
}
