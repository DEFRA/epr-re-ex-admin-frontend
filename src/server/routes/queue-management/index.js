import { queueManagementGetController } from './controller.get.js'
import { queueManagementConfirmClearGetController } from './controller.get-confirm.js'
import { queueManagementPostController } from './controller.post.js'
import { requireScope } from '#server/common/helpers/auth/require-scope.js'

const requireDlqPurge = [requireScope('admin.dlq.purge')]

export const queueManagement = {
  plugin: {
    name: 'queue-management',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/queue-management',
          ...queueManagementGetController,
          options: {
            app: { pageTitle: 'Queue management' }
          }
        },
        {
          method: 'GET',
          path: '/queue-management/confirm-clear',
          ...queueManagementConfirmClearGetController,
          options: {
            pre: requireDlqPurge,
            app: { pageTitle: 'Confirm clear all messages' }
          }
        },
        {
          method: 'POST',
          path: '/queue-management/clear',
          ...queueManagementPostController,
          options: {
            pre: requireDlqPurge
          }
        }
      ])
    }
  }
}
