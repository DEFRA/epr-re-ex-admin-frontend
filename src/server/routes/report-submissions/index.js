import { reportSubmissionsGetController } from './controller.get.js'
import { reportSubmissionsPostController } from './controller.post.js'

export const reportSubmissions = {
  plugin: {
    name: 'report-submissions',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/report-submissions',
          ...reportSubmissionsGetController
        },
        {
          method: 'POST',
          path: '/report-submissions',
          ...reportSubmissionsPostController
        }
      ])
    }
  }
}
