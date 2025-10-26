import { describe, test, expect, beforeEach } from 'vitest'
import { generateKeyPairSync } from 'crypto'
import Jwt from '@hapi/jwt'
import {
  createMockOidcServer,
  capturedRequests,
  clearCapturedRequests,
  privateKey,
  mockOidcResponse
} from '#server/common/test-helpers/mock-oidc.js'
import { config } from '#config/config.js'

const clientId = config.get('entraId.clientId')
const tenantId = config.get('entraId.tenantId')

const mockToken = Jwt.token.generate(
  {
    name: 'John Doe',
    aud: clientId,
    iss: `https://login.microsoftonline.com/${tenantId}/v2.0`
  },
  { key: privateKey, algorithm: 'RS256' },
  { header: { kid: 'test-key-id' } }
)

const { verifyToken } = await import('./verify-token.js')

describe('verifyToken', () => {
  beforeEach(async () => {
    clearCapturedRequests()
    createMockOidcServer()
  })

  test('should make api get request to jwks uri and parse response to json', async () => {
    await verifyToken(mockToken)

    const requestsToJwks = capturedRequests.filter((req) =>
      req.url.includes(mockOidcResponse.jwks_uri)
    )

    expect(requestsToJwks.length).toBe(1)
  })

  test('should not throw error if the token was signed by the correct key', async () => {
    await expect(verifyToken(mockToken)).resolves.not.toThrow()
  })

  test('should throw error if the token was not signed by the correct key', async () => {
    const { privateKey: wrongPrivateKey } = generateKeyPairSync('rsa', {
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

    const wrongToken = Jwt.token.generate(
      { name: 'Some other token' },
      { key: wrongPrivateKey, algorithm: 'RS256' },
      { header: { kid: 'wrong-key-id' } }
    )

    await expect(verifyToken(wrongToken)).rejects.toThrow()
  })
})
