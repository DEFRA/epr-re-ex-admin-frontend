import { organisationsGETController } from '#server/routes/organisation/controller.get.js'
import { organisationsPOSTController } from '#server/routes/organisation/controller.post.js'

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
          ...organisationsGETController
        },
        {
          method: 'POST',
          path: '/organisations/{id}',
          ...organisationsPOSTController
        }
      ])
    }
  }
}
