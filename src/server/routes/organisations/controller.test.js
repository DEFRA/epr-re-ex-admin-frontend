import { createServer } from '#server/server.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

describe('#organisationsController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/organisations'
    })

    expect(result).toEqual(expect.stringContaining('Organisations |'))
    expect(statusCode).toBe(statusCodes.ok)
  })
})
