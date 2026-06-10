import { unlinkOrganisationConfirmGetController } from './controller.get-confirm.js'
import { unlinkOrganisationPostController } from './controller.post.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'

const BASE = '/organisations/{organisationId}/unlink-defra-id'
const requireWrite = [requireScope(SCOPES.adminWrite)]

export const unlinkOrganisation = {
  plugin: {
    name: 'unlink-organisation',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `${BASE}/confirm`,
          ...unlinkOrganisationConfirmGetController,
          options: {
            pre: requireWrite,
            app: { pageTitle: 'Unlink organisation from Defra ID' }
          }
        },
        {
          method: 'POST',
          path: BASE,
          ...unlinkOrganisationPostController,
          options: {
            pre: requireWrite
          }
        }
      ])
    }
  }
}
