import { ecsFormat } from '@elastic/ecs-pino-format'
import { getTraceId } from '@defra/hapi-tracing'

import { config, isProductionEnvironment } from '#config/config.js'

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
  mixin() {
    const mixinValues = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  }
}
