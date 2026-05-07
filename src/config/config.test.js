import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'

import {
  config,
  isLocalEnvironment,
  isProductionEnvironment
} from './config.js'

describe('#config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe(isProductionEnvironment, () => {
    afterEach(() => {
      config.reset('cdpEnvironment')
    })

    it('should return true when cdpEnvironment is prod', () => {
      config.set('cdpEnvironment', 'prod')

      expect(isProductionEnvironment()).toBe(true)
    })

    it.each([
      'local',
      'infra-dev',
      'management',
      'dev',
      'test',
      'perf-test',
      'ext-test'
    ])('should return false when cdpEnvironment is %s', (env) => {
      config.set('cdpEnvironment', env)

      expect(isProductionEnvironment()).toBe(false)
    })
  })

  describe(isLocalEnvironment, () => {
    afterEach(() => {
      config.reset('cdpEnvironment')
    })

    it('should return true when cdpEnvironment is local', () => {
      config.set('cdpEnvironment', 'local')

      expect(isLocalEnvironment()).toBe(true)
    })

    it.each([
      'infra-dev',
      'management',
      'dev',
      'test',
      'perf-test',
      'ext-test',
      'prod'
    ])('should return false when cdpEnvironment is %s', (env) => {
      config.set('cdpEnvironment', env)

      expect(isLocalEnvironment()).toBe(false)
    })
  })

  describe('production defaults', () => {
    it('should default log.format to ecs when NODE_ENV is production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const configModule = await import('./config.js')

      expect(configModule.config.get('log.format')).toBe('ecs')
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
      const originalWellKnown = process.env.OIDC_WELL_KNOWN_CONFIGURATION_URL
      delete process.env.OIDC_WELL_KNOWN_CONFIGURATION_URL
      const configModule = await import('./config.js')
      const config = configModule.config

      const url = config.get('entraId.oidcWellKnownConfigurationUrl')
      expect(url).toBe(
        'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/v2.0/.well-known/openid-configuration'
      )

      if (originalWellKnown === undefined) {
        delete process.env.OIDC_WELL_KNOWN_CONFIGURATION_URL
      } else {
        process.env.OIDC_WELL_KNOWN_CONFIGURATION_URL = originalWellKnown
      }
    })
  })
})
