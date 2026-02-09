import { linkedOrganisationsGetController } from './controller.get.js'
import { linkedOrganisationsPostController } from './controller.post.js'

export const linkedOrganisations = {
  plugin: {
    name: 'linked-organisations',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/linked-organisations',
          ...linkedOrganisationsGetController,
          options: {
            app: { pageTitle: 'Linked organisations' }
          }
        },
        {
          method: 'POST',
          path: '/linked-organisations',
          ...linkedOrganisationsPostController
        }
      ])
    }
  }
}
