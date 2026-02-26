import Boom from '@hapi/boom'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'

const REQUIRED_ROLE = 'service_maintainer'

export const rbacPlugin = {
  plugin: {
    name: 'rbac-plugin',
    register: (server) => {
      server.ext('onPreHandler', async (request, h) => {
        const routeAuth = request.route.settings.auth
        if (routeAuth === false) {
          return h.continue
        }

        if (request.path.startsWith('/auth')) {
          return h.continue
        }

        const userSession = await getUserSession(request)
        if (!userSession?.roles?.includes(REQUIRED_ROLE)) {
          throw Boom.forbidden()
        }

        return h.continue
      })
    }
  }
}
