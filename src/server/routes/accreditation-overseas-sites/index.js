import { accreditationOverseasSitesGETController } from './controller.get.js'

export const accreditationOverseasSites = {
  plugin: {
    name: 'accreditationOverseasSites',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/organisations/{organisationNumber}/registrations/{registrationNumber}/accreditations/{year}/overseas-sites',
          ...accreditationOverseasSitesGETController,
          options: {
            app: { pageTitle: 'Overseas sites' }
          }
        }
      ])
    }
  }
}
