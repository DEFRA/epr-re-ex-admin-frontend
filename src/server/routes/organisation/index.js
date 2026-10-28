import { organisationsGETController } from './controller.get.js'
import { organisationsPOSTController } from './controller.post.js'

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
            app: { pageTitle: 'Organisation Details' }
          }
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
