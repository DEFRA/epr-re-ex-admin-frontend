import process from 'node:process'

import { startServer } from './server/common/helpers/start-server.js'
import { createLogger } from './server/common/helpers/logging/logger.js'

await startServer()

process.on('unhandledRejection', (reason) => {
  const logger = createLogger()
  const err = reason instanceof Error ? reason : new Error(String(reason))
  logger.error({ err, message: 'Unhandled rejection' })
  process.exitCode = 1
})
