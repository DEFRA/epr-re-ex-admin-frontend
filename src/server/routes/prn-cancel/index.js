import Joi from 'joi'

import { prnCancelConfirmGetController } from './controller.get-confirm.js'
import { prnCancelPostController } from './controller.post.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'
import { PAGE_TITLE } from './constants.js'

const BASE = '/prn-activity/{prnId}/cancel'
const requireWrite = [requireScope(SCOPES.adminWrite)]

const idParam = Joi.string()
  .pattern(/^[\w-]+$/)
  .required()

export const prnCancel = {
  plugin: {
    name: 'prn-cancel',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: `${BASE}/confirm`,
          ...prnCancelConfirmGetController,
          options: {
            pre: requireWrite,
            app: { pageTitle: PAGE_TITLE },
            validate: {
              params: Joi.object({ prnId: idParam })
            }
          }
        },
        {
          method: 'POST',
          path: BASE,
          ...prnCancelPostController,
          options: {
            pre: requireWrite,
            validate: {
              params: Joi.object({ prnId: idParam })
            }
          }
        }
      ])
    }
  }
}
