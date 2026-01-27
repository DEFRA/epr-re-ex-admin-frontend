import { publicRegisterGetController } from './controller.get.js'
import { publicRegisterPostController } from './controller.post.js'

export const publicRegister = {
  plugin: {
    name: 'public-register',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/public-register',
          ...publicRegisterGetController,
          options: {
            app: { pageTitle: 'Public register' }
          }
        },
        {
          method: 'POST',
          path: '/public-register',
          ...publicRegisterPostController
        }
      ])
    }
  }
}
