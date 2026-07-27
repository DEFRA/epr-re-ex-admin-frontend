import { ACCREDITATION_STATUS_TRANSITIONS } from './transitions.js'
import { createConfirmGetController } from './controller.get-confirm.js'
import { createTransitionPostController } from './controller.post.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'

const BASE =
  '/organisations/{organisationId}/registrations/{registrationId}/accreditations/{accreditationId}'
const requireWrite = [requireScope(SCOPES.adminWrite)]

export const accreditationStatusTransition = {
  plugin: {
    name: 'accreditation-status-transition',
    register(server) {
      for (const [action, transition] of Object.entries(
        ACCREDITATION_STATUS_TRANSITIONS
      )) {
        server.route([
          {
            method: 'GET',
            path: `${BASE}/${action}/confirm`,
            ...createConfirmGetController(action, transition),
            options: {
              pre: requireWrite
            }
          },
          {
            method: 'POST',
            path: `${BASE}/${action}`,
            ...createTransitionPostController(action, transition),
            options: {
              pre: requireWrite
            }
          }
        ])
      }
    }
  }
}
