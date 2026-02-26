import { organisationsController } from './controller.js'
import { ROLES } from '#server/common/constants/roles.js'

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
          ...organisationsController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] },
            app: { pageTitle: 'Organisations' }
          }
        },
        {
          method: 'POST',
          path: '/organisations',
          ...organisationsController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] },
            app: { pageTitle: 'Organisations' }
          }
        }
      ])
    }
  }
}
