import Joi from 'joi'

import { linkedOrganisationsController } from './controller.js'
import { linkedOrganisationsDownloadController } from './controller.download.js'
import { ROLES } from '#server/common/constants/roles.js'

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
            auth: { scope: [ROLES.serviceMaintainer] },
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
          ...linkedOrganisationsDownloadController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] }
          }
        }
      ])
    }
  }
}
