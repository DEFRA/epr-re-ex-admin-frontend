import { wasteBalanceAvailabilityGetController } from './controller.get.js'
import { wasteBalanceAvailabilityPostController } from './controller.post.js'

export const wasteBalanceAvailability = {
  plugin: {
    name: 'waste-balance-availability',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/waste-balance-availability',
          ...wasteBalanceAvailabilityGetController,
          options: {
            app: { pageTitle: 'Waste balance availability' }
          }
        },
        {
          method: 'POST',
          path: '/waste-balance-availability',
          ...wasteBalanceAvailabilityPostController
        }
      ])
    }
  }
}
