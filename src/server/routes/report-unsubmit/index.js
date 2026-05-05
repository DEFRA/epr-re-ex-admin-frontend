import { reportUnsubmitConfirmGetController } from './controller.get-confirm.js'
import { reportUnsubmitPostController } from './controller.post.js'
import { reportUnsubmitResultGetController } from './controller.get-result.js'
import { PAGE_TITLE } from './constants.js'

const BASE =
  '/organisations/{organisationId}/registrations/{registrationId}/reports/{year}/{cadence}/{period}'

export const reportUnsubmit = {
  plugin: {
    name: 'report-unsubmit',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `${BASE}/unsubmit/confirm`,
          ...reportUnsubmitConfirmGetController,
          options: { app: { pageTitle: PAGE_TITLE } }
        },
        {
          method: 'POST',
          path: `${BASE}/unsubmit`,
          ...reportUnsubmitPostController
        },
        {
          method: 'GET',
          path: `${BASE}/unsubmit/result`,
          ...reportUnsubmitResultGetController,
          options: { app: { pageTitle: PAGE_TITLE } }
        }
      ])
    }
  }
}
