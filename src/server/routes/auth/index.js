import signIn from './sign-in/index.js'
import signOut from './sign-out/index.js'
import signInOidc from './callback/index.js'

const auth = {
  plugin: {
    name: 'auth',
    register: (server) => {
      server.route([signIn, signInOidc, signOut])
    }
  }
}

export { auth }
