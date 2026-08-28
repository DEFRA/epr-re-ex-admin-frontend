import Joi from 'joi'
import { summaryLogDocumentGetController } from './controller.get.js'

const idParam = Joi.string()
  .pattern(/^[\w-]+$/)
  .required()

export const summaryLogDocument = {
  plugin: {
    name: 'summary-log-document',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationId}/registrations/{registrationId}/summary-logs/{summaryLogId}',
          ...summaryLogDocumentGetController,
          options: {
            app: { pageTitle: 'Summary log' },
            validate: {
              params: Joi.object({
                organisationId: idParam,
                registrationId: idParam,
                summaryLogId: idParam
              })
            }
          }
        }
      ])
    }
  }
}
