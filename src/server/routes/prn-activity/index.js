import { accreditationParams } from '#server/common/helpers/natural-keys/accreditation-params.js'
import { prnActivityController } from './controller.js'
import { prnActivityDownloadController } from './controller.download.js'
import { prnActivityScopedDownloadController } from './controller.scoped-download.js'

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
        },
        {
          method: 'GET',
          path: '/organisations/{organisationNumber}/registrations/{registrationNumber}/accreditations/{year}/prn-activity/download',
          ...prnActivityScopedDownloadController,
          options: {
            validate: { params: accreditationParams }
          }
        }
      ])
    }
  }
}
