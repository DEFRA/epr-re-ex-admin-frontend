import { http, HttpResponse } from '../../../../.vite/setup-msw.js'
import { config } from '#config/config.js'

function mockOidcCall() {
  return http.get(config.get('entraId.oidcWellKnownConfigurationUrl'), () => {
    return HttpResponse.json({
      authorization_endpoint: `https://login.microsoftonline.com/${config.get('entraId.tenantId')}/oauth2/v2.0/authorize`,
      token_endpoint: `https://login.microsoftonline.com/${config.get('entraId.tenantId')}/oauth2/v2.0/token`,
      end_session_endpoint: `https://login.microsoftonline.com/${config.get('entraId.tenantId')}/oauth2/v2.0/logout`,
      issuer: `https://login.microsoftonline.com/${config.get('entraId.tenantId')}/v2.0`,
      jwks_uri: `https://login.microsoftonline.com/${config.get('entraId.tenantId')}/discovery/v2.0/keys`
    })
  })
}

export { mockOidcCall }
