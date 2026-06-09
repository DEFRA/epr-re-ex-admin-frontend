import { reportUnsubmitConfirmGetController } from './controller.get-confirm.js'
import { reportUnsubmitPostController } from './controller.post.js'
import { reportUnsubmitResultGetController } from './controller.get-result.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'
import { PAGE_TITLE } from './constants.js'

const BASE =
  '/organisations/{organisationId}/registrations/{registrationId}/reports/{year}/{cadence}/{period}'

const requireWrite = [requireScope(SCOPES.adminWrite)]

export const reportUnsubmit = {
  plugin: {
    name: 'report-unsubmit',
    register(server) {
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
