import { suspendAccreditationConfirmGetController } from './controller.get-confirm.js'
import { suspendAccreditationPostController } from './controller.post.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'

const BASE =
  '/organisations/{organisationId}/registrations/{registrationId}/accreditations/{accreditationId}/suspend'
const requireWrite = [requireScope(SCOPES.adminWrite)]

export const suspendAccreditation = {
  plugin: {
    name: 'suspend-accreditation',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `${BASE}/confirm`,
          ...suspendAccreditationConfirmGetController,
          options: {
            pre: requireWrite,
            app: { pageTitle: 'Suspend accreditation' }
          }
        },
        {
          method: 'POST',
          path: BASE,
          ...suspendAccreditationPostController,
          options: {
            pre: requireWrite
          }
        }
      ])
    }
  }
}
