import { http, server, HttpResponse } from '../../../../.vite/setup-msw.js'
import { config } from '#config/config.js'
import { generateKeyPairSync } from 'crypto'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'jwk'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
})

const tenantId = config.get('entraId.tenantId')
const mockEntraIdBaseUrl = `https://login.microsoftonline.com/${tenantId}`

const mockOidcResponse = {
  authorization_endpoint: `${mockEntraIdBaseUrl}/oauth2/v2.0/authorize`,
  token_endpoint: `${mockEntraIdBaseUrl}/oauth2/v2.0/token`,
  end_session_endpoint: `${mockEntraIdBaseUrl}/oauth2/v2.0/logout`,
  issuer: `${mockEntraIdBaseUrl}/v2.0`,
  jwks_uri: `${mockEntraIdBaseUrl}/discovery/v2.0/keys`
}

const mockJwksResponse = {
  keys: [{ ...publicKey, kid: 'test-key-id' }]
}

const capturedRequests = []

function clearCapturedRequests() {
  capturedRequests.length = 0
}

function mockOidcCall() {
  const oidcWellKnownConfigurationUrl = config.get(
    'entraId.oidcWellKnownConfigurationUrl'
  )

  return http.get(oidcWellKnownConfigurationUrl, () => {
    // Capture request details for inspection
    capturedRequests.push({
      url: oidcWellKnownConfigurationUrl,
      method: 'GET'
    })

    return HttpResponse.json(mockOidcResponse)
  })
}

function mockJwksCall() {
  return http.get(mockOidcResponse.jwks_uri, () => {
    // Capture request details for inspection
    capturedRequests.push({
      url: mockOidcResponse.jwks_uri,
      method: 'GET'
    })

    return HttpResponse.json(mockJwksResponse)
  })
}

const createMockOidcServer = () => {
  server.use(mockOidcCall())
  server.use(mockJwksCall())
}

export {
  mockOidcCall,
  mockJwksCall,
  mockOidcResponse,
  createMockOidcServer,
  privateKey,
  capturedRequests,
  clearCapturedRequests
}
