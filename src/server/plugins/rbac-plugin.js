import Boom from '@hapi/boom'
import { ROLES } from '#server/common/constants/roles.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'

const DEFAULT_REQUIRED_ROLES = [ROLES.serviceMaintainer]

export const rbacPlugin = {
  plugin: {
    name: 'rbac-plugin',
    register: (server) => {
      server.ext('onPostAuth', async (request, h) => {
        const authSettings = request.route.settings.auth

        if (authSettings === false || authSettings?.mode === 'try') {
          return h.continue
        }

        if (!request.auth.isAuthenticated) {
          return h.continue
        }

        const requiredRoles =
          request.route.settings.app?.requiredRoles ?? DEFAULT_REQUIRED_ROLES

        if (requiredRoles.length === 0) {
          return h.continue
        }

        const userSession = await getUserSession(request)
        const userRoles = userSession?.roles ?? []

        const hasRequiredRole = requiredRoles.some((role) =>
          userRoles.includes(role)
        )

        if (!hasRequiredRole) {
          throw Boom.forbidden(
            'You do not have the required role to access this page'
          )
        }

        return h.continue
      })
    }
  }
}
