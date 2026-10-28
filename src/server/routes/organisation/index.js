import { organisationsGETController } from './controller.get.js'
import { organisationsPOSTController } from './controller.post.js'

/** The status-change pages still return to the editor by id. */
const EDITOR_PATHS = [
  '/organisations/{id}',
  '/organisations/{organisationNumber}/edit'
]

export const organisation = {
  plugin: {
    name: 'organisation',
    register(server) {
      server.route(
        EDITOR_PATHS.flatMap((path) => [
          {
            method: 'GET',
            path,
            ...organisationsGETController,
            options: {
              app: { pageTitle: 'Organisation Details' }
            }
          },
          {
            method: 'POST',
            path,
            ...organisationsPOSTController
          }
        ])
      )
    }
  }
}
