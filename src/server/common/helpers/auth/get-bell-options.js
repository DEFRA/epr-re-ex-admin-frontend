import Jwt from '@hapi/jwt'
import { config } from '#config/config.js'
import { getScopesForAuth } from './get-scopes-for-auth.js'

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
      profile: function (credentials, _params, _get) {
        const payload = Jwt.token.decode(credentials.token).decoded.payload
        const { oid: id, name = '', preferred_username: email } = payload

        credentials.profile = {
          id,
          name,
          email,
          displayName: payload.name?.trim() || ''
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
