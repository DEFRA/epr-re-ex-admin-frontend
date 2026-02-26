import { wasteBalanceAvailabilityGetController } from './controller.get.js'
import { wasteBalanceAvailabilityPostController } from './controller.post.js'
import { ROLES } from '#server/common/constants/roles.js'

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
            auth: { scope: [ROLES.serviceMaintainer] },
            app: { pageTitle: 'Waste balance availability' }
          }
        },
        {
          method: 'POST',
          path: '/waste-balance-availability',
          ...wasteBalanceAvailabilityPostController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] }
          }
        }
      ])
    }
  }
}
