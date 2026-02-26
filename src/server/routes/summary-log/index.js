import { summaryLogUploadsReportGetController } from './controller.get.js'
import { summaryLogUploadsReportPostController } from './controller.post.js'
import { ROLES } from '#server/common/constants/roles.js'

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
            auth: { scope: [ROLES.serviceMaintainer] },
            app: { pageTitle: 'Summary log uploads report' }
          }
        },
        {
          method: 'POST',
          path: '/summary-log',
          ...summaryLogUploadsReportPostController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] }
          }
        }
      ])
    }
  }
}
