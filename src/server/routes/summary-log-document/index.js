import Joi from 'joi'
import { summaryLogDocumentGetController } from './controller.get.js'

export const summaryLogDocument = {
  plugin: {
    name: 'summary-log-document',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationNumber}/registrations/{registrationNumber}/summary-logs/{summaryLogId}',
          ...summaryLogDocumentGetController,
          options: {
            app: { pageTitle: 'Summary log' },
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
