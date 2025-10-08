import signin from './signin/index.js'
import signout from './signout/index.js'
import signinOidc from './signin-oidc/index.js'
import signoutOidc from './signout-oidc/index.js'

const auth = {
  plugin: {
    name: 'auth',
    register: (server) => {
      server.route([signin, signout, signinOidc, signoutOidc])
    }
  }
}

export { auth }
