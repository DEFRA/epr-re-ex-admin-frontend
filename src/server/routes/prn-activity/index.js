import { prnActivityController } from './controller.js'
import { prnActivityDownloadController } from './controller.download.js'
import { ROLES } from '#server/common/constants/roles.js'

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
            auth: { scope: [ROLES.serviceMaintainer] },
            app: { pageTitle: 'PRN activity' }
          }
        },
        {
          method: 'GET',
          path: '/prn-activity/download',
          ...prnActivityDownloadController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] }
          }
        }
      ])
    }
  }
}
