import { overseasSitesImportStatusController } from './controller.js'

export const overseasSitesImportStatus = {
  plugin: {
    name: 'overseas-sites-import-status',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/overseas-sites/imports/{importId}',
          ...overseasSitesImportStatusController,
          options: {
            app: { pageTitle: 'Overseas sites import' }
          }
        }
      ])
    }
  }
}
