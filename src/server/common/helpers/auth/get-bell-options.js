import Jwt from '@hapi/jwt'
import { config } from '#config/config.js'

export function getBellOptions(oidcConfig) {
  return {
    provider: {
      name: 'entra-id',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: oidcConfig.authorization_endpoint,
      token: oidcConfig.token_endpoint,
      scope: [
        'openid',
        'profile',
        'email',
        'offline_access',
        `api://${config.get('entraId.clientId')}/.default`
      ],
      profile: function (credentials, _params, _get) {
        const payload = Jwt.token.decode(credentials.token).decoded.payload
        const { name = '', sub = '', email = '' } = payload

        credentials.profile = {
          name,
          email,
          sub,
          displayName: payload.name?.trim() || ''
        }
      }
    },
    clientId: config.get('entraId.clientId'),
    clientSecret: config.get('entraId.clientSecret'),
    password: config.get('session.cookie.password'),
    isSecure: config.get('isProduction'),
    forceHttps: config.get('isProduction'),
    location: `${config.get('appBaseUrl')}/auth/callback`,
    providerParams: function (_request) {
      return {
        response_mode: 'query'
      }
    }
  }
}
