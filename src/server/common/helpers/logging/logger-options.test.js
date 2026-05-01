import pino from 'pino'
import { afterEach, describe, expect, it, test, vi } from 'vitest'

import { config } from '#config/config.js'
import { loggerOptions } from './logger-options.js'

let mockGetTraceId

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: () => mockGetTraceId()
}))

const newLogger = () => {
  const lines = []
  const stream = { write: (s) => lines.push(s) }
  const { transport: _transport, ...rest } = loggerOptions
  const logger = pino({ ...rest, enabled: true, level: 'trace' }, stream)
  return { logger, lines }
}

describe('#loggerOptions', () => {
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

describe('loggerOptions.formatters.log', () => {
  afterEach(() => {
    config.reset('cdpEnvironment')
  })

  it('should preserve error.stack_trace when cdpEnvironment is non-prod', () => {
    config.set('cdpEnvironment', 'dev')
    const { logger, lines } = newLogger()

    logger.error({ err: new Error('boom') }, 'failed')
    const out = JSON.parse(lines[0])

    expect(out.error.stack_trace).toStrictEqual(
      expect.stringContaining('Error: boom')
    )
  })

  it('should strip error.stack_trace when cdpEnvironment is prod', () => {
    config.set('cdpEnvironment', 'prod')
    const { logger, lines } = newLogger()

    logger.error({ err: new Error('boom') }, 'failed')
    const out = JSON.parse(lines[0])

    expect(out.error).toBeDefined()
    expect(out.error).not.toHaveProperty('stack_trace')
  })

  it('should strip error.stack_trace from manually constructed error block in prod', () => {
    config.set('cdpEnvironment', 'prod')
    const { logger, lines } = newLogger()

    logger.warn({
      message: 'boom plugin shape',
      error: {
        code: '400',
        message: 'bad',
        stack_trace: 'Error: bad\n    at frame',
        type: 'Bad Request'
      }
    })
    const out = JSON.parse(lines[0])

    expect(out.error).toStrictEqual({
      code: '400',
      message: 'bad',
      type: 'Bad Request'
    })
  })
})
