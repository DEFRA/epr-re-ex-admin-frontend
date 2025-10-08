import authController from './controller.js'

export default {
  method: 'GET',
  path: '/auth/callback',
  options: {
    auth: { strategy: 'entra-id', mode: 'try' }
  },
  ...authController
}
