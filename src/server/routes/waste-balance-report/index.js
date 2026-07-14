import { wasteBalanceReportGetController } from './controller.get.js'
import { wasteBalanceReportPostController } from './controller.post.js'

export const wasteBalanceReport = {
  plugin: {
    name: 'waste-balance-report',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/waste-balance-report',
          ...wasteBalanceReportGetController
        },
        {
          method: 'POST',
          path: '/waste-balance-report',
          ...wasteBalanceReportPostController
        }
      ])
    }
  }
}
