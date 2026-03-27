import { orsUploadGetController } from './controller.get.js'
import { orsDownloadController } from './controller.download.js'
import { orsListGetController } from './controller.list.get.js'
import { orsUploadStatusGetController } from './controller.status.get.js'
import { orsUploadRoutes } from './constants.js'
import { config } from '#config/config.js'
import Joi from 'joi'

export const orsUpload = {
  plugin: {
    name: 'ors-upload',
    register(server) {
      if (!config.get('featureFlags.overseasSites')) {
        return
      }

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
