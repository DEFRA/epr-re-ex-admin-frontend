import { prnActivityController } from './controller.js'
import { prnActivityDownloadController } from './controller.download.js'

export const prnActivity = {
  plugin: {
    name: 'prn-activity',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/prn-activity',
          ...prnActivityController,
          options: {
            app: { pageTitle: 'PRN activity' }
          }
        },
        {
          method: 'GET',
          path: '/prn-activity/download',
          ...prnActivityDownloadController
        }
      ])
    }
  }
}
