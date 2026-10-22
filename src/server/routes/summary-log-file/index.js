import Joi from 'joi'
import { summaryLogFileGetController } from './controller.get.js'

export const summaryLogFile = {
  plugin: {
    name: 'summary-log-file',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationNumber}/registrations/{registrationNumber}/summary-logs/{summaryLogId}/file',
          ...summaryLogFileGetController,
          options: {
            validate: {
              params: Joi.object({
                organisationNumber: Joi.string().required(),
                registrationNumber: Joi.string().required(),
                summaryLogId: Joi.string()
                  .pattern(/^[\w-]+$/)
                  .required()
              })
            }
          }
        }
      ])
    }
  }
}
