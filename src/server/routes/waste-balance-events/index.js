import { wasteBalanceEventsGETController } from './controller.get.js'

export const wasteBalanceEvents = {
  plugin: {
    name: 'wasteBalanceEvents',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationId}/registrations/{registrationId}/accreditations/{accreditationId}/waste-balance-events',
          ...wasteBalanceEventsGETController,
          options: {
            app: { pageTitle: 'Waste balance events' }
          }
        }
      ])
    }
  }
}
