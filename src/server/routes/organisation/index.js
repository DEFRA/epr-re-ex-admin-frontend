import { organisationsController } from './controller.js'

/**
 * Sets up the routes used in the /organisations page.
 * These routes are registered in src/server/router.js.
 */
export const organisation = {
  plugin: {
    name: 'organisation',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{id}',
          options: {
            auth: false
          },
          ...organisationsController
        }
      ])
    }
  }
}
