import { organisationsGETController } from './controller.get.js'

export const organisation = {
  plugin: {
    name: 'organisation',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{id}',
          ...organisationsGETController
        }
      ])
    }
  }
}
