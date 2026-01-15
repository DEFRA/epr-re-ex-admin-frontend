import { config } from '#config/config.js'
import { getScopesForAuth } from './get-scopes-for-auth.js'
import { verifyToken } from '#server/common/helpers/auth/verify-token.js'

export function getBellOptions(oidcConfig) {
  const scopes = getScopesForAuth()

  return {
    provider: {
      name: 'entra-id',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: oidcConfig.authorization_endpoint,
      token: oidcConfig.token_endpoint,
      scope: scopes,
      profile: async function (credentials, _params, _get) {
        const tokenPayload = await verifyToken(credentials.token)
        const { oid: id } = tokenPayload
        const name = tokenPayload.name?.trim() || ''
        const email = tokenPayload.email || tokenPayload.preferred_username

        credentials.profile = {
          id,
          name,
          email,
          displayName: name
        }
      }
    },
    clientId: config.get('entraId.clientId'),
    clientSecret: config.get('entraId.clientSecret'),
    password: config.get('session.cookie.password'),
    isSecure: config.get('isProduction'),
    forceHttps: config.get('isProduction'),
    location: function (request) {
      if (request.info.referrer) {
        const { hash, pathname, search } = new URL(request.info.referrer)

        if (!pathname.startsWith('/auth/callback')) {
          const referrer = `${pathname}${search}${hash}`
          request.yar.flash('referrer', referrer)
        }
      }

      return `${config.get('appBaseUrl')}/auth/callback`
    },

    providerParams: function (_request) {
      return {
        response_mode: 'query'
      }
    }
  }
}
