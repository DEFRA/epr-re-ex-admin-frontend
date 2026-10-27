import Joi from 'joi'
import { registrationOverviewGETController } from './controller.get.js'

export const registrationOverview = {
  plugin: {
    name: 'registrationOverview',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationNumber}/registrations/{registrationNumber}/overview',
          ...registrationOverviewGETController,
          options: {
            app: { pageTitle: 'Registration overview' },
            validate: {
              query: Joi.object({
                year: Joi.number().integer().min(2000).max(9999).optional()
              })
            }
          }
        }
      ])
    }
  }
}
