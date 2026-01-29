import { tonnageMonitoringGetController } from './controller.get.js'

export const tonnageMonitoring = {
  plugin: {
    name: 'tonnage-monitoring',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/tonnage-monitoring',
          ...tonnageMonitoringGetController,
          options: {
            app: { pageTitle: 'Tonnage monitoring' }
          }
        }
      ])
    }
  }
}
