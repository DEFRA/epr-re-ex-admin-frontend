import { orsUploadGetController } from './controller.get.js'
import { orsDownloadController } from './controller.download.js'
import { orsListGetController } from './controller.list.get.js'
import { orsUploadStatusGetController } from './controller.status.get.js'
import { orsUploadRoutes } from './constants.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'
import Joi from 'joi'

const requireWrite = [requireScope(SCOPES.adminWrite)]

export const orsUpload = {
  plugin: {
    name: 'ors-upload',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: orsUploadRoutes.list,
          ...orsListGetController,
          options: {
            app: { pageTitle: 'Overseas reprocessing sites' }
          }
        },
        {
          method: 'POST',
          path: orsUploadRoutes.list,
          ...orsDownloadController
        },
        {
          method: 'GET',
          path: orsUploadRoutes.uploads,
          ...orsUploadGetController,
          options: {
            pre: requireWrite,
            app: { pageTitle: 'Upload ORS workbooks' }
          }
        },
        {
          method: 'GET',
          path: orsUploadRoutes.uploadStatus,
          ...orsUploadStatusGetController,
          options: {
            app: { pageTitle: 'ORS upload status' },
            validate: {
              params: Joi.object({
                importId: Joi.string().uuid().required()
              })
            }
          }
        }
      ])
    }
  }
}
