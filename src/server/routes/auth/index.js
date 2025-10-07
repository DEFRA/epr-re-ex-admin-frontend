import { callback } from './callback'
import { signin } from './signin'
import { signout } from './signout'

const auth = {
  plugin: {
    name: 'auth',
    register: (server) => {
      server.route([callback, signin, signout])
    }
  }
}

export { auth }
