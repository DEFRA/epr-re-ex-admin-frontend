import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'
import { orsUpload } from './index.js'
import { orsUploadRoutes } from './constants.js'

describe('#ors-upload routes plugin', () => {
  const mockServer = {
    route: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should have correct plugin name', () => {
    expect(orsUpload.plugin.name).toBe('ors-upload')
  })

  test('Should register routes', () => {
    orsUpload.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    expect(mockServer.route).toHaveBeenCalledWith(expect.any(Array))
  })

  test('Should register upload and status routes', () => {
    orsUpload.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes).toHaveLength(3)
    expect(registeredRoutes[0]).toMatchObject({
      method: 'GET',
      path: orsUploadRoutes.list,
      options: {
        app: { pageTitle: 'Overseas reprocessing sites' }
      }
    })

    expect(registeredRoutes[1]).toMatchObject({
      method: 'GET',
      path: orsUploadRoutes.uploads,
      options: {
        app: { pageTitle: 'Upload ORS workbooks' }
      }
    })

    expect(registeredRoutes[2]).toMatchObject({
      method: 'GET',
      path: orsUploadRoutes.uploadStatus,
      options: {
        app: { pageTitle: 'ORS upload status' }
      }
    })
  })

  test('Should validate importId as a uuid on status route', async () => {
    orsUpload.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const statusRoute = registeredRoutes[2]
    const schema = statusRoute.options.validate.params

    await expect(
      schema.validateAsync({ importId: 'not-a-uuid' })
    ).rejects.toThrow()
    await expect(
      schema.validateAsync({ importId: '8e76e280-dbd2-4d36-9679-c1f6adc31f6b' })
    ).resolves.toMatchObject({
      importId: '8e76e280-dbd2-4d36-9679-c1f6adc31f6b'
    })
  })

  test('Should register route objects with handlers', () => {
    orsUpload.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes[0]).toHaveProperty('handler')
    expect(registeredRoutes[1]).toHaveProperty('handler')
    expect(registeredRoutes[2]).toHaveProperty('handler')
  })

  test('Should maintain plugin structure', () => {
    expect(orsUpload).toHaveProperty('plugin')
    expect(orsUpload.plugin).toHaveProperty('name')
    expect(orsUpload.plugin).toHaveProperty('register')
    expect(typeof orsUpload.plugin.register).toBe('function')
  })
})
