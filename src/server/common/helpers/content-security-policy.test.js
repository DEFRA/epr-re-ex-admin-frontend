import { createServer } from '#server/server.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { cspFormAction } from '#server/common/helpers/content-security-policy.js'
import { config } from '#config/config.js'

describe(cspFormAction, () => {
  test.each([
    [
      'non-production',
      {
        isProduction: false,
        cdpUploaderUrl: 'http://localhost:7337'
      },
      ['self', 'localhost:*', 'http://localhost:7337']
    ],
    [
      'non-production with custom port',
      {
        isProduction: false,
        cdpUploaderUrl: 'http://localhost:9000'
      },
      ['self', 'localhost:*', 'http://localhost:9000']
    ],
    [
      'production',
      {
        isProduction: true,
        cdpUploaderUrl: 'https://cdp-uploader.prod.example.gov.uk'
      },
      ['self']
    ]
  ])('should use %s values', (_, cfg, expected) => {
    expect(cspFormAction(cfg)).toStrictEqual(expected)
  })
})

describe('#contentSecurityPolicy', () => {
  let server

  beforeAll(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should set the CSP policy header', async () => {
    const resp = await server.inject({
      method: 'GET',
      url: '/'
    })

    const expectedFormAction = cspFormAction({
      isProduction: config.get('isProduction'),
      cdpUploaderUrl: config.get('cdpUploaderUrl')
    })

    const csp = resp.headers['content-security-policy']
    expect(csp).toBeDefined()
    expect(csp).toContain("form-action 'self'")

    if (expectedFormAction.includes('localhost:*')) {
      expect(csp).toContain('localhost:*')
    } else {
      expect(csp).not.toContain('localhost:*')
    }

    for (const value of expectedFormAction.filter(
      (entry) => entry !== 'self'
    )) {
      expect(csp).toContain(value)
    }
  })
})
