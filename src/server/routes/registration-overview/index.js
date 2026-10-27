import Joi from 'joi'
import { registrationOverviewGETController } from './controller.get.js'

const MIN_REPORT_YEAR = 2000
const MAX_REPORT_YEAR = 9999

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
                year: Joi.number()
                  .integer()
                  .min(MIN_REPORT_YEAR)
                  .max(MAX_REPORT_YEAR)
                  .optional()
              })
            }
          }
        }
      ])
    }
  }
}
