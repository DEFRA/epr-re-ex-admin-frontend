import { organisationsGETController } from './controller.get.js'
import { organisationsPOSTController } from './controller.post.js'
import { ROLES } from '#server/common/constants/roles.js'

export const organisation = {
  plugin: {
    name: 'organisation',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{id}',
          ...organisationsGETController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] },
            app: { pageTitle: 'Organisation Details' }
          }
        },
        {
          method: 'POST',
          path: '/organisations/{id}',
          ...organisationsPOSTController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] }
          }
        }
      ])
    }
  }
}
