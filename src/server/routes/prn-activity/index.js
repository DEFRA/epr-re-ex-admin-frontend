import Joi from 'joi'

import { prnActivityController } from './controller.js'
import { prnActivityDownloadController } from './controller.download.js'
import { prnActivityScopedDownloadController } from './controller.scoped-download.js'

const idParam = Joi.string()
  .pattern(/^[\w-]+$/)
  .required()

export const prnActivity = {
  plugin: {
    name: 'prn-activity',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/prn-activity',
          ...prnActivityController,
          options: {
            app: { pageTitle: 'PRN activity' }
          }
        },
        {
          method: 'GET',
          path: '/prn-activity/download',
          ...prnActivityDownloadController
        },
        {
          method: 'GET',
          path: '/organisations/{organisationId}/registrations/{registrationId}/accreditations/{accreditationId}/prn-activity/download',
          ...prnActivityScopedDownloadController,
          options: {
            validate: {
              params: Joi.object({
                organisationId: idParam,
                registrationId: idParam,
                accreditationId: idParam
              })
            }
          }
        }
      ])
    }
  }
}
