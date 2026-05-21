import Joi from 'joi'
import { systemLogGetController } from './controller.get.js'
import { systemLogDownloadController } from './controller.download.js'

const idParam = Joi.string()
  .pattern(/^[\w-]+$/)
  .required()

export const systemLogs = {
  plugin: {
    name: 'system-logs',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/system-logs/download/{organisationId}/{registrationId}/{summaryLogId}',
          ...systemLogDownloadController,
          options: {
            validate: {
              params: Joi.object({
                organisationId: idParam,
                registrationId: idParam,
                summaryLogId: idParam
              })
            }
          }
        },
        {
          method: 'GET',
          path: '/system-logs',
          ...systemLogGetController,
          options: {
            app: { pageTitle: 'System logs' },
            validate: {
              query: Joi.object({
                referenceNumber: Joi.string().allow('').optional(),
                userId: Joi.string().allow('').optional(),
                subCategory: Joi.string().allow('').optional(),
                cursor: Joi.string().hex().length(24).optional(),
                direction: Joi.string().valid('next', 'prev').optional()
              })
            }
          }
        }
      ])
    }
  }
}
