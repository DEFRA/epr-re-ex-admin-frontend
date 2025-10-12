import { organisationsController } from './controller.js'

// TODO:: This index file is not tested yet (same as other route registerers)
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
          ...organisationsController
        }
      ])
    }
  }
}
