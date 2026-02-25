import process from 'node:process'

import { startServer } from './server/common/helpers/start-server.js'
import { createLogger } from './server/common/helpers/logging/logger.js'

await startServer()

process.on('unhandledRejection', (error) => {
  const logger = createLogger()
  logger.error({ err: error, message: 'Unhandled rejection' })
  process.exitCode = 1
})
