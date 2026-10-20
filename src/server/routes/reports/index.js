import {
  REPORT_SUBMISSION_PATHS,
  atReportAddress
} from '#server/common/helpers/report-address.js'
import { reportDetailGETController } from './controller.get.js'

export const reports = {
  plugin: {
    name: 'reports',
    register(server) {
      server.route(
        REPORT_SUBMISSION_PATHS.map((path) => ({
          method: 'GET',
          path,
          ...reportDetailGETController,
          options: {
            pre: [atReportAddress()],
            app: { pageTitle: 'Report' }
          }
        }))
      )
    }
  }
}
