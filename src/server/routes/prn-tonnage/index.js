import { prnTonnageGetController } from './controller.get.js'
import { prnTonnagePostController } from './controller.post.js'

export const prnTonnage = {
  plugin: {
    name: 'prn-tonnage',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/prn-tonnage',
          ...prnTonnageGetController,
          options: {
            app: { pageTitle: 'PRN tonnage' }
          }
        },
        {
          method: 'POST',
          path: '/prn-tonnage',
          ...prnTonnagePostController
        }
      ])
    }
  }
}
