import { reportUnsubmitConfirmGetController } from './controller.get-confirm.js'
import { reportUnsubmitPostController } from './controller.post.js'
import { reportUnsubmitResultGetController } from './controller.get-result.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'
import {
  REPORT_SUBMISSION_PATHS,
  atReportAddress
} from '#server/common/helpers/report-address.js'
import { PAGE_TITLE } from './constants.js'

const requireWrite = requireScope(SCOPES.adminWrite)

export const reportUnsubmit = {
  plugin: {
    name: 'report-unsubmit',
    register(server) {
      server.route(
        REPORT_SUBMISSION_PATHS.flatMap((base) => [
          {
            method: 'GET',
            path: `${base}/unsubmit/confirm`,
            ...reportUnsubmitConfirmGetController,
            options: {
              pre: [atReportAddress('/unsubmit/confirm'), requireWrite],
              app: { pageTitle: PAGE_TITLE }
            }
          },
          {
            method: 'POST',
            path: `${base}/unsubmit`,
            ...reportUnsubmitPostController,
            options: {
              pre: [atReportAddress('/unsubmit'), requireWrite]
            }
          },
          {
            method: 'GET',
            path: `${base}/unsubmit/result`,
            ...reportUnsubmitResultGetController,
            options: {
              pre: [atReportAddress('/unsubmit/result')],
              app: { pageTitle: PAGE_TITLE }
            }
          }
        ])
      )
    }
  }
}
