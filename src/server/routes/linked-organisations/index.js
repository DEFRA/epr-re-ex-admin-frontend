import { linkedOrganisationsController } from './controller.js'
import { linkedOrganisationsDownloadController } from './controller.download.js'

export const linkedOrganisations = {
  plugin: {
    name: 'linked-organisations',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/linked-organisations',
          handler: linkedOrganisationsController.handler,
          options: {
            ...linkedOrganisationsController.options,
            app: { pageTitle: 'Linked organisations' }
          }
        },
        {
          method: 'POST',
          path: '/linked-organisations/download',
          ...linkedOrganisationsDownloadController
        }
      ])
    }
  }
}
