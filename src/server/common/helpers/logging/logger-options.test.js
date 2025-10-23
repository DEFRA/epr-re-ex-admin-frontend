import { beforeEach, describe, expect, test, vi } from 'vitest'

let mockGetTraceId

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: () => mockGetTraceId()
}))

describe('#loggerOptions', () => {
  let loggerOptions

  beforeEach(async () => {
    vi.resetModules()
    const loggerOptionsModule = await import('./logger-options.js')
    loggerOptions = loggerOptionsModule.loggerOptions
  })

  describe('mixin function', () => {
    test('Should include trace ID in mixin when trace ID exists', () => {
      mockGetTraceId = vi.fn().mockReturnValue('test-trace-id-123')

      const result = loggerOptions.mixin()

      expect(result).toEqual({
        trace: { id: 'test-trace-id-123' }
      })
    })

    test('Should return empty object from mixin when trace ID does not exist', () => {
      mockGetTraceId = vi.fn().mockReturnValue(null)

      const result = loggerOptions.mixin()

      expect(result).toEqual({})
    })
  })
})
