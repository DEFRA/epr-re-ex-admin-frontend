import { config } from '#config/config.js'
import { reportUnsubmitConfirmGetController } from './controller.get-confirm.js'
import { reportUnsubmitPostController } from './controller.post.js'
import { reportUnsubmitResultGetController } from './controller.get-result.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { FEATURE_FLAG_KEY, PAGE_TITLE } from './constants.js'

const BASE =
  '/organisations/{organisationId}/registrations/{registrationId}/reports/{year}/{cadence}/{period}'

const requireWrite = [requireScope('admin.write')]

export const reportUnsubmit = {
  plugin: {
    name: 'report-unsubmit',
    register(server) {
      if (!config.get(FEATURE_FLAG_KEY)) {
        return
      }

      server.route([
        {
          method: 'GET',
          path: `${BASE}/unsubmit/confirm`,
          ...reportUnsubmitConfirmGetController,
          options: {
            pre: requireWrite,
            app: { pageTitle: PAGE_TITLE }
          }
        },
        {
          method: 'POST',
          path: `${BASE}/unsubmit`,
          ...reportUnsubmitPostController,
          options: {
            pre: requireWrite
          }
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
