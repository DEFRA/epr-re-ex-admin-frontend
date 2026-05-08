import { wasteRecordsExportGetController } from './controller.get.js'
import { wasteRecordsExportPostController } from './controller.post.js'

export const wasteRecordsExport = {
  plugin: {
    name: 'waste-records-export',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/waste-records-export',
          ...wasteRecordsExportGetController
        },
        {
          method: 'POST',
          path: '/waste-records-export',
          ...wasteRecordsExportPostController
        }
      ])
    }
  }
}
