import { signinController } from '../auth/signin/controller.js'

/**
 * Sets up the routes used in the /signin page.
 * These routes are registered in src/server/router.js.
 */
export const signin = {
  plugin: {
    name: 'signin',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/signin',
          options: {
            auth: false
          },
          ...signinController
        }
      ])
    }
  }
}
