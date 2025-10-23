import { beforeEach, describe, expect, test, vi } from 'vitest'

describe('#config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('Log redact configuration', () => {
    test('Should set log redact paths for production environment', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const configModule = await import('./config.js')
      const config = configModule.config

      const redactPaths = config.get('log.redact')
      expect(redactPaths).toEqual([
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers'
      ])
    })

    test('Should set log redact paths to empty array for non-production environments', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      const configModule = await import('./config.js')
      const config = configModule.config

      const redactPaths = config.get('log.redact')
      expect(redactPaths).toEqual([])
    })
  })

  describe('Getter functions', () => {
    test('Should generate appBaseUrl default from port', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      const configModule = await import('./config.js')
      const config = configModule.config

      const appBaseUrl = config.get('appBaseUrl')
      expect(appBaseUrl).toBe('http://localhost:3002')
    })

    test('Should generate oidcWellKnownConfigurationUrl default from tenantId', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      const configModule = await import('./config.js')
      const config = configModule.config

      const url = config.get('entraId.oidcWellKnownConfigurationUrl')
      expect(url).toBe(
        'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/v2.0/.well-known/openid-configuration'
      )
    })
  })
})
