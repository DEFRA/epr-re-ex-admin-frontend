import { accreditationAssignGetController } from './controller.get-confirm.js'
import { accreditationAssignPostController } from './controller.post.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'

// Deliberately not nested under a registration: every other admin
// accreditation route is, and an accreditation with no registration cannot be
// addressed that way.
const BASE =
  '/organisations/{organisationId}/accreditations/{accreditationId}/assign'
const requireWrite = [requireScope(SCOPES.adminWrite)]

export const accreditationAssign = {
  plugin: {
    name: 'accreditation-assign',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `${BASE}/confirm`,
          ...accreditationAssignGetController,
          options: {
            pre: requireWrite,
            app: { pageTitle: 'Assign accreditation to registration' }
          }
        },
        {
          method: 'POST',
          path: BASE,
          ...accreditationAssignPostController,
          options: {
            pre: requireWrite
          }
        }
      ])
    }
  }
}
