import { orsUploadGetController } from './controller.get.js'
import { orsUploadStatusGetController } from './controller.status.get.js'
import Joi from 'joi'

export const orsUpload = {
  plugin: {
    name: 'ors-upload',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/overseas-sites/imports',
          ...orsUploadGetController,
          options: {
            app: { pageTitle: 'Upload ORS workbooks' }
          }
        },
        {
          method: 'GET',
          path: '/overseas-sites/imports/{importId}',
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
