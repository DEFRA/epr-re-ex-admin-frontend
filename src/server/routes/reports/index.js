import { reportDetailGETController } from './controller.get.js'

export const reports = {
  plugin: {
    name: 'reports',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationId}/registrations/{registrationId}/reports/{year}/{cadence}/{period}',
          ...reportDetailGETController,
          options: {
            app: { pageTitle: 'Report' }
          }
        }
      ])
    }
  }
}
