import { creditedTonnageGetController } from './controller.get.js'
import { creditedTonnagePostController } from './controller.post.js'

export const creditedTonnage = {
  plugin: {
    name: 'credited-tonnage',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/credited-tonnage',
          ...creditedTonnageGetController
        },
        {
          method: 'POST',
          path: '/credited-tonnage',
          ...creditedTonnagePostController
        }
      ])
    }
  }
}
