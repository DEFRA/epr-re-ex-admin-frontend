import { accreditationParams } from '#server/common/helpers/natural-keys/accreditation-params.js'
import { wasteBalanceEventsGETController } from './controller.get.js'

export const wasteBalanceEvents = {
  plugin: {
    name: 'wasteBalanceEvents',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationNumber}/registrations/{registrationNumber}/accreditations/{year}/waste-balance-events',
          ...wasteBalanceEventsGETController,
          options: {
            app: { pageTitle: 'Waste balance events' },
            validate: { params: accreditationParams }
          }
        }
      ])
    }
  }
}
