import { publicRegisterGetController } from './controller.get.js'
import { publicRegisterPostController } from './controller.post.js'
import { ROLES } from '#server/common/constants/roles.js'

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
            auth: { scope: [ROLES.serviceMaintainer] },
            app: { pageTitle: 'Public register' }
          }
        },
        {
          method: 'POST',
          path: '/public-register',
          ...publicRegisterPostController,
          options: {
            auth: { scope: [ROLES.serviceMaintainer] }
          }
        }
      ])
    }
  }
}
