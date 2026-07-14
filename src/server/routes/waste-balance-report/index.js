import { wasteBalanceReportGetController } from './controller.get.js'

export const wasteBalanceReport = {
  plugin: {
    name: 'waste-balance-report',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/waste-balance-report',
          ...wasteBalanceReportGetController
        }
      ])
    }
  }
}
