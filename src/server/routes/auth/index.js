import callback from './callback/index.js'
import signin from './signin/index.js'
import signout from './signout/index.js'

const auth = {
  plugin: {
    name: 'auth',
    register: (server) => {
      server.route([callback, signin, signout])
    }
  }
}

export { auth }
