import signin from './signin/index.js'
import signout from './signout/index.js'
import signinOidc from './callback/index.js'

const auth = {
  plugin: {
    name: 'auth',
    register: (server) => {
      server.route([signin, signinOidc, signout])
    }
  }
}

export { auth }
