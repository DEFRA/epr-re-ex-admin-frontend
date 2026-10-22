import Joi from 'joi'
import { systemLogGetController } from './controller.get.js'

export const systemLogs = {
  plugin: {
    name: 'system-logs',
    register(server) {
      server.route([
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
              }).with('direction', 'cursor')
            }
          }
        }
      ])
    }
  }
}
