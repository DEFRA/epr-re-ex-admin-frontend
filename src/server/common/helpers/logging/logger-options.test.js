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

  describe('err serialiser', () => {
    test('Should format Error instance with message, stack trace, and type', () => {
      const { err: errorSerializer } = loggerOptions.serializers
      const error = new Error('Something went wrong')

      const result = errorSerializer(error)

      expect(result).toEqual({
        message: 'Something went wrong',
        stack_trace: expect.stringContaining('Error: Something went wrong'),
        type: 'Error'
      })
    })

    test('Should format custom Error subclass correctly', () => {
      const { err: errorSerializer } = loggerOptions.serializers

      class CustomError extends Error {
        constructor(message) {
          super(message)
          this.name = 'CustomError'
        }
      }

      const error = new CustomError('Custom error message')
      const result = errorSerializer(error)

      expect(result).toEqual({
        message: 'Custom error message',
        stack_trace: expect.stringContaining(
          'CustomError: Custom error message'
        ),
        type: 'CustomError'
      })
    })

    test('Should return value as-is for non-Error values', () => {
      const { err: errorSerializer } = loggerOptions.serializers

      expect(errorSerializer('string error')).toBe('string error')
      expect(errorSerializer(123)).toBe(123)
      expect(errorSerializer(null)).toBeNull()
      expect(errorSerializer(undefined)).toBeUndefined()
      expect(errorSerializer({ message: 'not an error' })).toEqual({
        message: 'not an error'
      })
    })

    test('Should include Boom error details in non-prod environment', () => {
      const { err: errorSerializer } = loggerOptions.serializers

      const boomError = new Error('Validation failed')
      boomError.isBoom = true
      boomError.output = {
        statusCode: 422,
        payload: {
          error: 'Unprocessable Entity',
          message: 'Validation failed: field is required',
          validation: { source: 'payload', keys: ['field'] }
        }
      }

      const result = errorSerializer(boomError)

      expect(result).toEqual({
        message: 'Validation failed',
        stack_trace: expect.stringContaining('Error: Validation failed'),
        type: 'Error',
        statusCode: 422,
        payload: {
          error: 'Unprocessable Entity',
          message: 'Validation failed: field is required',
          validation: { source: 'payload', keys: ['field'] }
        }
      })
    })

    test('Should enhance message with Boom data details in non-prod environment', () => {
      const { err: errorSerializer } = loggerOptions.serializers

      const boomError = new Error('Unauthorised')
      boomError.isBoom = true
      boomError.output = {
        statusCode: 401,
        payload: { error: 'Unauthorised', message: 'Unauthorised' }
      }
      boomError.data = {
        reason: 'Token issuer not recognised',
        issuer: 'https://unknown-issuer.example.com'
      }

      const result = errorSerializer(boomError)

      expect(result.message).toContain('Unauthorised')
      expect(result.message).toContain('Token issuer not recognised')
    })

    test('Should fall back to [unserializable] when Boom data has circular references', () => {
      const { err: errorSerializer } = loggerOptions.serializers
      const circular = {}
      circular.self = circular

      const boomError = new Error('Gateway error')
      boomError.isBoom = true
      boomError.output = {
        statusCode: 502,
        payload: { error: 'Bad Gateway', message: 'Gateway error' }
      }
      boomError.data = circular

      const result = errorSerializer(boomError)

      expect(result.message).toBe('Gateway error | data: [unserializable]')
    })
  })
})

describe('#loggerOptions in production environment', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('Should exclude Boom error details in prod environment', async () => {
    vi.doMock('#config/config.js', () => ({
      config: {
        get: vi.fn((key) => {
          const values = {
            log: {
              enabled: true,
              level: 'info',
              format: 'ecs',
              redact: []
            },
            serviceName: 'test-service',
            serviceVersion: '1.0.0',
            cdpEnvironment: 'prod'
          }
          return values[key]
        })
      }
    }))

    const { loggerOptions: prodLoggerOptions } =
      await import('./logger-options.js')
    const { err: errorSerializer } = prodLoggerOptions.serializers

    const boomError = new Error('Validation failed')
    boomError.isBoom = true
    boomError.output = {
      statusCode: 422,
      payload: {
        error: 'Unprocessable Entity',
        message: 'Sensitive details'
      }
    }
    boomError.data = { sensitiveInfo: 'should not appear' }

    const result = errorSerializer(boomError)

    expect(result).toEqual({
      message: 'Validation failed',
      stack_trace: expect.stringContaining('Error: Validation failed'),
      type: 'Error'
    })
    expect(result.statusCode).toBeUndefined()
    expect(result.payload).toBeUndefined()
    expect(result.message).not.toContain('sensitiveInfo')
  })
})
