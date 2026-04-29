import { organisationsGetController } from './controller.get.js'
import { organisationsPostController } from './controller.post.js'

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
          ...organisationsGetController,
          options: {
            app: { pageTitle: 'Organisations' }
          }
        },
        {
          method: 'POST',
          path: '/organisations',
          ...organisationsPostController,
          options: {
            app: { pageTitle: 'Organisations' }
          }
        }
      ])
    }
  }
}
