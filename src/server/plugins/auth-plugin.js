import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import { getBellOptions } from '../common/helpers/auth/get-bell-options.js'
import { getCookieOptions } from '../common/helpers/auth/get-cookie-options.js'
import { config } from '../../config/config.js'

export const authPlugin = {
  plugin: {
    name: 'auth-plugin',
    register: async (server) => {
      const oidcWellKnownUrl = config.get(
        'entraId.oidcWellKnownConfigurationUrl'
      )

      if (oidcWellKnownUrl) {
        const oidcConfig = await getOidcConfig()
        server.auth.strategy('entra-id', 'bell', getBellOptions(oidcConfig))
      } else {
        server.auth.strategy('entra-id', 'bell', {
          provider: 'github',
          password: config.get('session.cookie.password'),
          clientId: 'placeholder',
          clientSecret: 'placeholder',
          isSecure: config.get('isProduction')
        })
      }

      server.auth.strategy('session', 'cookie', getCookieOptions())

      server.auth.default('session')
    }
  }
}
