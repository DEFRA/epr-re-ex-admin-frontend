import { signinController } from './controller.js'

export default {
  method: 'GET',
  path: '/auth/signin',
  options: {
    auth: 'entra-id'
  },
  ...signinController
}
