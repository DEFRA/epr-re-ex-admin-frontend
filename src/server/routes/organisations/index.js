import { organisationsController } from './controller.js'
import { organisationsAllController } from './all/controller.js'
import { organisationsSearchController } from './search/controller.js'

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
        },
        {
          method: 'GET',
          path: '/organisations/all',
          ...organisationsAllController
        },
        {
          method: 'GET',
          path: '/organisations/search',
          ...organisationsSearchController
        }
      ])
    }
  }
}
