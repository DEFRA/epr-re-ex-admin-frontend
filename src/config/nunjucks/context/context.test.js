import { vi } from 'vitest'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'

const mockGetUserSession = vi.fn().mockResolvedValue(mockUserSession)

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: mockGetUserSession
}))

const mockReadFileSync = vi.fn()
const mockLoggerError = vi.fn()

vi.mock('node:fs', async () => {
  const nodeFs = await import('node:fs')

  return {
    ...nodeFs,
    readFileSync: () => mockReadFileSync()
  }
})

vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

describe('context and cache', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset()
    mockLoggerError.mockReset()
    vi.resetModules()
  })

  describe('#context', () => {
    const mockRequest = {
      path: '/'
    }

    describe('When webpack manifest file read succeeds', () => {
      let contextImport
      let contextResult

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(async () => {
        // Return JSON string
        mockReadFileSync.mockReturnValue(`{
        "application.js": "javascripts/application.js",
        "stylesheets/application.scss": "stylesheets/application.css"
      }`)

        contextResult = await contextImport.context(mockRequest)
      })

      test('Should provide expected context', () => {
        expect(contextResult).toEqual({
          assetPath: '/public/assets',
          getAssetPath: expect.any(Function),
          navigation: [
            {
              current: true,
              text: 'Home',
              href: '/'
            },
            {
              current: false,
              text: 'Organisations',
              href: '/organisations'
            },
            {
              current: false,
              text: 'Linked organisations',
              href: '/linked-organisations'
            },
            {
              current: false,
              text: 'Public register',
              href: '/public-register'
            },
            {
              current: false,
              text: 'Tonnage monitoring',
              href: '/tonnage-monitoring'
            },
            {
              current: false,
              text: 'System logs',
              href: '/system-logs'
            }
          ],
          serviceName: 'epr-re-ex-admin-frontend',
          serviceUrl: '/',
          userSession: mockUserSession,
          isAuthenticated: true
        })
      })

      describe('With valid asset path', () => {
        test('Should provide expected asset path', () => {
          expect(contextResult.getAssetPath('application.js')).toBe(
            '/public/javascripts/application.js'
          )
        })
      })

      describe('With invalid asset path', () => {
        test('Should provide expected asset', () => {
          expect(contextResult.getAssetPath('an-image.png')).toBe(
            '/public/an-image.png'
          )
        })
      })

      describe('In development mode', () => {
        let originalNodeEnv
        let contextImportDev
        let contextResultDev

        beforeAll(async () => {
          originalNodeEnv = process.env.NODE_ENV
          process.env.NODE_ENV = 'development'
          vi.resetModules()
          contextImportDev = await import('./context.js')
          contextResultDev = await contextImportDev.context(mockRequest)
        })

        afterAll(() => {
          process.env.NODE_ENV = originalNodeEnv
          vi.resetModules()
        })

        test('Should add timestamp query parameter to asset paths', () => {
          const assetPath = contextResultDev.getAssetPath('application.js')

          expect(assetPath).toMatch(
            /^\/public\/javascripts\/application\.js\?v=\d+$/
          )
        })

        test('Should use current timestamp for cache busting', () => {
          const before = Date.now()
          const assetPath = contextResultDev.getAssetPath('application.js')
          const after = Date.now()

          const timestamp = parseInt(assetPath.split('?v=')[1])
          expect(timestamp).toBeGreaterThanOrEqual(before)
          expect(timestamp).toBeLessThanOrEqual(after)
        })
      })
    })

    describe('When webpack manifest file read fails', () => {
      let contextImport
      const mockRequest = {
        path: '/',
        getUserSession: vi
          .fn()
          .mockResolvedValue({ userId: '123', isAuthenticated: true })
      }

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(async () => {
        mockReadFileSync.mockReturnValue(new Error('File not found'))

        await contextImport.context(mockRequest)
      })

      test('Should log that the Webpack Manifest file is not available', () => {
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Webpack assets-manifest.json not found'
        )
      })
    })
  })

  describe('#context cache', () => {
    const mockRequest = {
      path: '/'
    }
    let contextResult

    describe('Webpack manifest file cache', () => {
      let contextImport

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(async () => {
        // Return JSON string
        mockReadFileSync.mockReturnValue(`{
        "application.js": "javascripts/application.js",
        "stylesheets/application.scss": "stylesheets/application.css"
      }`)

        contextResult = await contextImport.context(mockRequest)
      })

      test('Should read file', () => {
        expect(mockReadFileSync).toHaveBeenCalled()
      })

      test('Should use cache', () => {
        expect(mockReadFileSync).not.toHaveBeenCalled()
      })

      test('Should provide expected context', () => {
        expect(contextResult).toEqual({
          assetPath: '/public/assets',
          getAssetPath: expect.any(Function),
          navigation: [
            {
              current: true,
              text: 'Home',
              href: '/'
            },
            {
              current: false,
              text: 'Organisations',
              href: '/organisations'
            },
            {
              current: false,
              text: 'Linked organisations',
              href: '/linked-organisations'
            },
            {
              current: false,
              text: 'Public register',
              href: '/public-register'
            },
            {
              current: false,
              text: 'Tonnage monitoring',
              href: '/tonnage-monitoring'
            },
            {
              current: false,
              text: 'System logs',
              href: '/system-logs'
            }
          ],
          serviceName: 'epr-re-ex-admin-frontend',
          serviceUrl: '/',
          userSession: mockUserSession,
          isAuthenticated: true
        })
      })
    })
  })
})
