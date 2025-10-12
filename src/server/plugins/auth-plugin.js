import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import { getBellOptions } from '../common/helpers/auth/get-bell-options.js'
import { getCookieOptions } from '../common/helpers/auth/get-cookie-options.js'

export const authPlugin = {
  plugin: {
    name: 'auth-plugin',
    register: async (server) => {
      const oidcConfig = await getOidcConfig()
      server.auth.strategy('entra-id', 'bell', getBellOptions(oidcConfig))
      server.auth.strategy('session', 'cookie', getCookieOptions())
      server.auth.default('session')
    }
  }
}
