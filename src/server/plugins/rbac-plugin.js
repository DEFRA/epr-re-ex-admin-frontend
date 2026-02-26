import Boom from '@hapi/boom'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { ROLES } from '#server/common/constants/roles.js'

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
        if (!userSession?.roles?.includes(ROLES.serviceMaintainer)) {
          throw Boom.forbidden()
        }

        return h.continue
      })
    }
  }
}
