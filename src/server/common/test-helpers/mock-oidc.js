import { http, server, HttpResponse } from '../../../../.vite/setup-msw.js'
import { config } from '#config/config.js'

const mockEntraIdBaseUrl = `https://example-oidc.test`

const mockOidcResponse = {
  authorization_endpoint: `${mockEntraIdBaseUrl}/oauth2/v2.0/authorize`,
  token_endpoint: `${mockEntraIdBaseUrl}/oauth2/v2.0/token`,
  end_session_endpoint: `${mockEntraIdBaseUrl}/oauth2/v2.0/logout`,
  issuer: `${mockEntraIdBaseUrl}/v2.0`,
  jwks_uri: `${mockEntraIdBaseUrl}/discovery/v2.0/keys`
}

function mockOidcCall() {
  return http.get(config.get('entraId.oidcWellKnownConfigurationUrl'), () => {
    return HttpResponse.json(mockOidcResponse)
  })
}

const createMockOidcServer = () => {
  server.use(mockOidcCall())
}

export { mockOidcCall, mockOidcResponse, createMockOidcServer }
