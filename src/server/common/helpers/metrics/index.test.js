import { vi } from 'vitest'

import { StorageResolution, Unit } from 'aws-embedded-metrics'

/**
 * @import { MetricName } from './index.js'
 * @import * as MetricsModule from './index.js'
 */

const mockPutMetric = vi.fn()
const mockFlush = vi.fn()
const mockLoggerError = vi.fn()

vi.mock(import('aws-embedded-metrics'), async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,
    createMetricsLogger: /** @type {typeof original.createMetricsLogger} */ (
      /** @type {unknown} */ (
        () => ({
          putMetric: mockPutMetric,
          flush: mockFlush
        })
      )
    )
  }
})

vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

/**
 * Enablement is read once when the module is evaluated, so a scenario has to
 * choose it before the import rather than toggling config per call.
 * @param {boolean} enabled
 */
const loadMetrics = async (enabled) => {
  vi.resetModules()
  process.env.ENABLE_METRICS = String(enabled)

  try {
    return await import('./index.js')
  } finally {
    delete process.env.ENABLE_METRICS
  }
}

/**
 * Group, method, and the name it emits -- the mapping is the CloudWatch
 * contract, so it is spelled out here rather than derived from the source.
 * @type {readonly ['signIn' | 'signOut', string, MetricName][]}
 */
const authMetrics = [
  ['signIn', 'attempted', 'signInAttempted'],
  ['signIn', 'success', 'signInSuccess'],
  ['signIn', 'failure', 'signInFailure'],
  ['signOut', 'success', 'signOutSuccess']
]

describe('#metrics', () => {
  /** @type {typeof MetricsModule.metrics} */
  let metrics

  describe('when metrics is not enabled', () => {
    beforeEach(async () => {
      vi.clearAllMocks()
      ;({ metrics } = await loadMetrics(false))
    })

    it.each(authMetrics)(
      'does not record metric - %s.%s',
      async (group, method) => {
        await metrics[group][method]()

        expect(mockPutMetric).not.toHaveBeenCalled()
        expect(mockFlush).not.toHaveBeenCalled()
      }
    )
  })

  describe('when metrics is enabled', () => {
    beforeEach(async () => {
      vi.clearAllMocks()
      ;({ metrics } = await loadMetrics(true))
    })

    it.each(authMetrics)(
      'records metric - %s.%s',
      async (group, method, metricName) => {
        await metrics[group][method]()

        expect(mockPutMetric).toHaveBeenCalledWith(
          metricName,
          1,
          Unit.Count,
          StorageResolution.Standard
        )
        expect(mockFlush).toHaveBeenCalled()
      }
    )
  })

  describe('when metrics throws', () => {
    beforeEach(async () => {
      vi.clearAllMocks()
      ;({ metrics } = await loadMetrics(true))
    })

    it.each(authMetrics)(
      'logs expected error - %s.%s',
      async (group, method) => {
        const mockError = 'mock-metrics-put-error'
        mockFlush.mockRejectedValueOnce(new Error(mockError))

        await metrics[group][method]()

        expect(mockLoggerError).toHaveBeenCalledWith({
          message: mockError,
          err: Error(mockError)
        })
      }
    )
  })
})
