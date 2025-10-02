import { GET as callback } from './callback/index.js'
import { GET as login } from './login/index.js'
import { GET as logout } from './logout/index.js'

export default {
  name: 'auth',
  register(server) {
    server.route([
      {
        method: 'GET',
        path: '/auth/callback',
        handler: callback
      },
      {
        method: 'GET',
        path: '/auth/login',
        handler: login
      },
      {
        method: 'GET',
        path: '/auth/logout',
        handler: logout
      }
    ])
  }
}
