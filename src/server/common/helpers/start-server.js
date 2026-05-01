import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { enableAuditing } from '@defra/cdp-auditing'

async function startServer() {
  enableAuditing(config.get('audit.isEnabled'))

  const server = await createServer()
  await server.start()

  server.logger.info({ message: 'Server started successfully' })
  server.logger.info({
    message: `Access your frontend on http://localhost:${config.get('port')}`
  })

  return server
}

export { startServer }
