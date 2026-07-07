import process from 'node:process'
import { inspect } from 'node:util'

import { startServer } from './server/common/helpers/start-server.js'
import { createLogger } from './server/common/helpers/logging/logger.js'

await startServer()

process.on('unhandledRejection', (reason) => {
  const logger = createLogger()
  const message = typeof reason === 'string' ? reason : inspect(reason)
  const err = reason instanceof Error ? reason : new Error(message)
  logger.error({ err, message: 'Unhandled rejection' })
  process.exitCode = 1
})
