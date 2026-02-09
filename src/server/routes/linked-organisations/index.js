import Joi from 'joi'

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
          ...linkedOrganisationsController,
          options: {
            validate: {
              query: Joi.object({
                search: Joi.string().optional().allow('').trim()
              })
            },
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
