import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import { getBellOptions } from '../common/helpers/auth/get-bell-options.js'
import { getCookieOptions } from '../common/helpers/auth/get-cookie-options.js'
import { config } from '../../config/config.js'

export default {
  plugin: {
    name: 'auth',
    register: async (server) => {
      const oidcConfig = await getOidcConfig()

      // Bell is a third-party plugin that provides a common interface for OAuth 2.0 authentication
      // Used to authenticate users with Defra Identity and a pre-requisite for the Cookie authentication strategy
      // Also used for changing organisations and signing out
      server.auth.strategy('entra-id', 'bell', getBellOptions(oidcConfig))

      // Cookie is a built-in authentication strategy for hapi.js that authenticates users based on a session cookie
      // Used for all non-Defra Identity routes
      // Lax policy required to allow redirection after Defra Identity sign out
      server.auth.strategy('session', 'cookie', getCookieOptions())

      // Set the default authentication strategy to session
      // All routes will require authentication unless explicitly set to 'entra-id' or `auth: false`
      server.auth.default('session')
    }
  }
}
