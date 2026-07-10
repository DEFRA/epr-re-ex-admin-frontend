import { grantRegistrationConfirmGetController } from './controller.get-confirm.js'
import { grantRegistrationPostController } from './controller.post.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'
import { PAGE_TITLE } from './constants.js'

const BASE = '/organisations/{organisationId}/registrations/{registrationId}'
const requireWrite = [requireScope(SCOPES.adminWrite)]

export const grantRegistration = {
  plugin: {
    name: 'grant-registration',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `${BASE}/approve/confirm`,
          ...grantRegistrationConfirmGetController,
          options: {
            pre: requireWrite,
            app: { pageTitle: PAGE_TITLE }
          }
        },
        {
          method: 'POST',
          path: `${BASE}/approve`,
          ...grantRegistrationPostController,
          options: {
            pre: requireWrite
          }
        }
      ])
    }
  }
}
