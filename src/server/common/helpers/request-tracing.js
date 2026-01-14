import { tracing } from '@defra/hapi-tracing'

import { config } from '#config/config.js'

export const getTracingHeaderName = () => config.get('tracing.header')

export const requestTracing = {
  plugin: tracing.plugin,
  options: { tracingHeader: getTracingHeaderName() }
}
