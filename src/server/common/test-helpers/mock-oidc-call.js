import { http, HttpResponse } from '../../../../.vite/setup-msw.js'
import { config } from '#config/config.js'

function mockOidcCall() {
  return http.get(config.get('entraId.oidcWellKnownConfigurationUrl'), () => {
    // TODO: This shouldn't need to be a real miscroft url
    const baseUrl = `https://login.microsoftonline.com/${config.get('entraId.tenantId')}`

    return HttpResponse.json({
      authorization_endpoint: `${baseUrl}/oauth2/v2.0/authorize`,
      token_endpoint: `${baseUrl}/oauth2/v2.0/token`,
      end_session_endpoint: `${baseUrl}/oauth2/v2.0/logout`,
      issuer: `${baseUrl}/v2.0`,
      jwks_uri: `${baseUrl}/discovery/v2.0/keys`
    })
  })
}

export { mockOidcCall }
