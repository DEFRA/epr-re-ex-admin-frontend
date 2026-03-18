import { createServer } from '#server/server.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { cspFormAction } from '#server/common/helpers/content-security-policy.js'

describe(cspFormAction, () => {
  test.each([
    [
      'non-production',
      {
        isProduction: false,
        cdpUploaderUrl: 'http://localhost:7337',
        isOverseasSitesFeatureEnabled: true
      },
      ['self', 'localhost:7337']
    ],
    [
      'non-production with custom port',
      {
        isProduction: false,
        cdpUploaderUrl: 'http://localhost:9000',
        isOverseasSitesFeatureEnabled: true
      },
      ['self', 'localhost:9000']
    ],
    [
      'production',
      {
        isProduction: true,
        cdpUploaderUrl: 'https://cdp-uploader.prod.example.gov.uk',
        isOverseasSitesFeatureEnabled: true
      },
      ['self']
    ],
    [
      'feature disabled',
      {
        isProduction: false,
        cdpUploaderUrl: 'http://localhost:7337',
        isOverseasSitesFeatureEnabled: false
      },
      ['self']
    ]
  ])('should use %s values', (_, cfg, expected) => {
    expect(cspFormAction(cfg)).toStrictEqual(expected)
  })

  test('should not allow external uploader host in production', () => {
    const formAction = cspFormAction({
      isProduction: true,
      cdpUploaderUrl: 'https://cdp-uploader.prod.example.gov.uk',
      isOverseasSitesFeatureEnabled: true
    })

    expect(formAction).toEqual(['self'])
    expect(formAction).not.toContain('cdp-uploader.prod.example.gov.uk')
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

    const csp = resp.headers['content-security-policy']
    expect(csp).toBeDefined()
    expect(csp).toContain("form-action 'self'")
  })
})
