import { summaryLogUploadsReportGetController } from './controller.get.js'
import { summaryLogUploadsReportPostController } from './controller.post.js'

export const summaryLogUploadsReport = {
  plugin: {
    name: 'summary-log',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/summary-log',
          ...summaryLogUploadsReportGetController,
          options: {
            app: { pageTitle: 'Summary log uploads report' }
          }
        },
        {
          method: 'POST',
          path: '/summary-log',
          ...summaryLogUploadsReportPostController
        }
      ])
    }
  }
}
