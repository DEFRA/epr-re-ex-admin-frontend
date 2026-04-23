import { organisationOverviewGETController } from './controller.get.js'

export const organisationOverview = {
  plugin: {
    name: 'organisationOverview',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{id}/overview',
          ...organisationOverviewGETController,
          options: {
            app: { pageTitle: 'Organisation Overview' }
          }
        }
      ])
    }
  }
}
