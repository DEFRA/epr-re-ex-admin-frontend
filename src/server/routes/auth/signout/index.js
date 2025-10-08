import { signoutController } from './controller.js'

export default [
  {
    method: 'GET',
    path: '/signout',
    options: {
      auth: false
    },
    ...signoutController
  }
]
