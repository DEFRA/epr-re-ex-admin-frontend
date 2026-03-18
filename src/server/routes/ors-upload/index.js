import { orsUploadGetController } from './controller.get.js'
import { orsUploadStatusGetController } from './controller.status.get.js'
import { orsUploadRoutes } from './constants.js'
import Joi from 'joi'

export const orsUpload = {
  plugin: {
    name: 'ors-upload',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: orsUploadRoutes.uploads,
          ...orsUploadGetController,
          options: {
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
