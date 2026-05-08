import hapi from '@hapi/hapi'
import hapiPino from 'hapi-pino'
import { describe, expect, it } from 'vitest'

import { loggerOptions } from './logging/logger-options.js'
import { userAgentProtection } from './useragent-protection.js'

const newServer = async () => {
  const lines = []
  const stream = { write: (s) => lines.push(s) }
  const { transport: _transport, ...rest } = loggerOptions

  const server = hapi.server({ port: 0 })
  await server.register({
    plugin: hapiPino,
    options: { ...rest, enabled: true, level: 'trace', stream }
  })
  await server.register(userAgentProtection)
  server.route({
    method: 'GET',
    path: '/test',
    options: { auth: false },
    handler: () => 'ok'
  })

  return { server, lines }
}

const findLine = (lines, predicate) =>
  lines.map((s) => JSON.parse(s)).find(predicate)

describe('userAgentProtection logging', () => {
  it('should emit an ECS-shaped warn line when User-Agent is truncated', async () => {
    const { server, lines } = await newServer()

    await server.inject({
      method: 'GET',
      url: '/test',
      headers: { 'user-agent': `Mozilla/5.0 ${'X'.repeat(2000)}` }
    })
    const out = findLine(lines, (l) => l.message === 'Truncated User-Agent')

    expect(out).toMatchObject({
      'log.level': 'warn',
      message: 'Truncated User-Agent',
      event: {
        action: 'user_agent_truncated',
        category: 'security',
        reason: 'from=2012 to=150'
      }
    })
  })

  it('should not emit a truncation warning when User-Agent is within limit', async () => {
    const { server, lines } = await newServer()

    await server.inject({
      method: 'GET',
      url: '/test',
      headers: { 'user-agent': 'Mozilla/5.0' }
    })
    const out = findLine(lines, (l) =>
      l.message?.startsWith('Truncated User-Agent')
    )

    expect(out).toBeUndefined()
  })
})
