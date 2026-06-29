import Joi from 'joi'

import { wasteRecordsExportGetController } from './controller.get.js'
import { wasteRecordsExportPostController } from './controller.post.js'
import { wasteRecordsRegistrationDownloadController } from './controller.registration-download.js'

const idParam = Joi.string()
  .pattern(/^[\w-]+$/)
  .required()

export const wasteRecordsExport = {
  plugin: {
    name: 'waste-records-export',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/waste-records-export',
          ...wasteRecordsExportGetController
        },
        {
          method: 'POST',
          path: '/waste-records-export',
          ...wasteRecordsExportPostController
        },
        {
          method: 'GET',
          path: '/organisations/{organisationId}/registrations/{registrationId}/waste-records/download',
          ...wasteRecordsRegistrationDownloadController,
          options: {
            validate: {
              params: Joi.object({
                organisationId: idParam,
                registrationId: idParam
              })
            }
          }
        }
      ])
    }
  }
}
