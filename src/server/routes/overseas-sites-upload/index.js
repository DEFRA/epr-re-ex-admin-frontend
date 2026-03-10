import { overseasSitesUploadController } from './controller.js'

export const overseasSitesUpload = {
  plugin: {
    name: 'overseas-sites-upload',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/overseas-sites/upload',
          ...overseasSitesUploadController,
          options: {
            app: { pageTitle: 'Upload overseas reprocessing sites' }
          }
        }
      ])
    }
  }
}
