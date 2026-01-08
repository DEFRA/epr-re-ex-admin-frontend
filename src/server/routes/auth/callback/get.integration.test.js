import { vi } from 'vitest'
import { config } from '#config/config.js'
import { createServer } from '#server/server.js'
import { randomUUID } from 'node:crypto'
import { statusCodes } from '#server/common/constants/status-codes.js'
import {
  createMockOidcServer,
  mockOidcResponse,
  privateKey
} from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import Jwt from '@hapi/jwt'

const mock = {
  cdpAuditing: vi.fn(),
  signInSuccessMetric: vi.fn(),
  signInFailureMetric: vi.fn()
}

vi.mock('#server/common/helpers/metrics/index.js', async (importOriginal) => ({
  metrics: {
    ...(await importOriginal()).metrics,
    signInFailure: () => mock.signInFailureMetric(),
    signInSuccess: () => mock.signInSuccessMetric()
  }
}))

vi.mock('@defra/cdp-auditing', () => ({
  audit: (...args) => mock.cdpAuditing(...args)
}))

describe('GET /auth/callback', () => {
  let server

  beforeEach(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop({ timeout: 0 })
    vi.clearAllMocks()
    // Ensure any stubbed globals are reset after each test
    if (typeof vi.unstubAllGlobals === 'function') {
      vi.unstubAllGlobals()
    }
  })

  const performSignInFlow = async (accessToken) => {
    const signInResponse = await server.inject({
      method: 'GET',
      url: '/auth/sign-in'
    })
    const ssoUrl = new URL(signInResponse.headers['location'])

    // bell-entra-id={cookieValue}; HttpOnly; SameSite=Strict; Path=/
    const bellCookie = signInResponse.headers['set-cookie']
      .toString()
      .split('=')[1]
      .split(';')[0]

    mswServer.use(
      http.post(mockOidcResponse.token_endpoint, ({ request }) => {
        return HttpResponse.json({
          access_token: Jwt.token.generate(
            accessToken,
            { key: privateKey, algorithm: 'RS256' },
            { header: { kid: 'test-key-id' } }
          )
        })
      })
    )

    const stateParam = ssoUrl.searchParams.get('state')
    const code = randomUUID()
    return await server.inject({
      method: 'GET',
      url: `/auth/callback?state=${stateParam}&code=${code}&refresh=1`,
      headers: {
        cookie: `bell-entra-id=${bellCookie}`
      }
    })
  }

  describe('on successful return from Entra ID', () => {
    let response = {}

    beforeEach(async () => {
      response = await performSignInFlow({
        oid: 'user-id',
        preferred_username: 'user@email.com',
        aud: config.get('entraId.clientId'),
        iss: mockOidcResponse.issuer
      })
    })

    it('redirects to home page', async () => {
      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers['location']).toEqual('/')
    })

    it('records sign in success metric', () => {
      expect(mock.signInSuccessMetric).toHaveBeenCalledTimes(1)
    })

    it('audits a successful sign in attempt', () => {
      expect(mock.cdpAuditing).toHaveBeenCalledTimes(1)
      expect(mock.cdpAuditing).toHaveBeenCalledWith({
        event: {
          category: 'access',
          subCategory: 'sso',
          action: 'sign-in'
        },
        context: {},
        user: {
          id: 'user-id',
          email: 'user@email.com'
        }
      })
    })
  })

  describe('on unsuccessful attempt to invoke callback from Entra ID', () => {
    let response = {}

    beforeEach(async () => {
      const code = randomUUID()
      response = await server.inject({
        method: 'GET',
        url: `/auth/callback?code=${code}&refresh=1` // does not supply state or other required parameters
      })
    })

    it('renders unauthorised page', async () => {
      expect(response.statusCode).toBe(statusCodes.ok)
      expect(response.result).toContain('Unauthorised')
    })

    it('records sign in failure metric', () => {
      expect(mock.signInFailureMetric).toHaveBeenCalledTimes(1)
    })
  })

  describe('on unverified access token received from Entra ID', () => {
    let response = {}

    beforeEach(async () => {
      response = await performSignInFlow({
        oid: 'user-id',
        preferred_username: 'user@email.com',
        aud: 'unexpected-audience',
        iss: mockOidcResponse.issuer
      })
    })

    it('renders unauthorised page', async () => {
      expect(response.statusCode).toBe(statusCodes.internalServerError)
      expect(response.result).toContain(
        'Sorry, there is a problem with the service'
      )
    })

    it('records sign in failure metric', () => {
      expect(mock.signInFailureMetric).toHaveBeenCalledTimes(1)
    })
  })
})
