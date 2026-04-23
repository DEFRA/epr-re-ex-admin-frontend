import { registrationOverviewGETController } from './controller.get.js'

export const registrationOverview = {
  plugin: {
    name: 'registrationOverview',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationId}/registrations/{registrationId}/overview',
          ...registrationOverviewGETController,
          options: {
            app: { pageTitle: 'Reports' }
          }
        }
      ])
    }
  }
}
