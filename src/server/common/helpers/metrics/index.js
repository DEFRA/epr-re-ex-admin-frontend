import {
  createMetricsLogger,
  StorageResolution,
  Unit
} from 'aws-embedded-metrics'

import { config } from '#config/config.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

/**
 * @typedef {'signInAttempted'
 *   | 'signInFailure'
 *   | 'signInSuccess'
 *   | 'signOutSuccess'} MetricName
 */

const isMetricsEnabled = config.get('isMetricsEnabled')

/**
 * Aws embedded metrics wrapper
 * @param {MetricName} metricName
 */
async function writeMetric(metricName) {
  const value = 1

  try {
    const metricsLogger = createMetricsLogger()

    metricsLogger.putMetric(
      metricName,
      value,
      Unit.Count,
      StorageResolution.Standard
    )
    await metricsLogger.flush()
  } catch (error) {
    createLogger().error({ message: error.message, err: error })
  }
}

/** @returns {Promise<void>} */
const noop = async () => {}

/**
 * @template {Record<string, (...args: never[]) => Promise<void>>} T
 * @param {T} enabled
 * @returns {T}
 */
const orNoop = (enabled) =>
  isMetricsEnabled
    ? enabled
    : /** @type {T} */ (
        Object.fromEntries(Object.keys(enabled).map((name) => [name, noop]))
      )

/**
 * Grouping is caller-side only -- the emitted names are a CloudWatch contract
 * that dashboards query, so they stay flat and unchanged.
 * @type {Record<string, () => Promise<void>>}
 */
const signIn = {
  attempted: () => writeMetric('signInAttempted'),
  success: () => writeMetric('signInSuccess'),
  failure: () => writeMetric('signInFailure')
}

/** @type {Record<string, () => Promise<void>>} */
const signOut = {
  success: () => writeMetric('signOutSuccess')
}

export const metrics = {
  signIn: orNoop(signIn),
  signOut: orNoop(signOut)
}
