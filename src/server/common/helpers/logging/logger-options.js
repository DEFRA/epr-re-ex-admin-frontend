import { ecsFormat } from '@elastic/ecs-pino-format'
import { getTraceId } from '@defra/hapi-tracing'

import { config, isProductionEnvironment } from '#config/config.js'

/**
 * @typedef {Error & {isBoom: true, output: {statusCode: number, payload: object}, data?: object}} BoomError
 */

const logConfig = config.get('log')
const serviceName = config.get('serviceName')
const serviceVersion = config.get('serviceVersion')

const ecsOptions = ecsFormat({ serviceVersion, serviceName })
const ecsLog =
  /** @type {(obj: object) => { error?: { stack_trace?: string } }} */ (
    ecsOptions.formatters?.log
  )

const stripStackTraceInProd = (/** @type {object} */ obj) => {
  const out = ecsLog(obj)
  if (isProductionEnvironment() && out.error?.stack_trace) {
    delete out.error.stack_trace
  }
  return out
}

const formatters = {
  ecs: {
    ...ecsOptions,
    formatters: {
      ...ecsOptions.formatters,
      log: stripStackTraceInProd
    }
  },
  'pino-pretty': { transport: { target: 'pino-pretty' } }
}

export const loggerOptions = {
  enabled: logConfig.enabled,
  ignorePaths: ['/health'],
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  serializers: {
    /** @param {unknown} err */
    err: (err) => {
      if (!(err instanceof Error)) {
        return err
      }

      const errorObj = {
        message: err.message,
        stack_trace: err.stack,
        type: err.name
      }

      // @ts-ignore - check for Boom error before casting
      if (!isProductionEnvironment() && err.isBoom && err.output) {
        /** @type {BoomError} */
        const boomErr = /** @type {BoomError} */ (err)
        errorObj.statusCode = boomErr.output.statusCode
        errorObj.payload = boomErr.output.payload

        if (boomErr.data) {
          try {
            errorObj.message = `${err.message} | data: ${JSON.stringify(boomErr.data)}`
          } catch {
            errorObj.message = `${err.message} | data: [unserializable]`
          }
        }
      }

      return errorObj
    }
  },
  mixin() {
    const mixinValues = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  }
}
