import { creditedTonnageGetController } from './controller.get.js'

export const creditedTonnage = {
  plugin: {
    name: 'credited-tonnage',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/credited-tonnage',
          ...creditedTonnageGetController
        }
      ])
    }
  }
}
