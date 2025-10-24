import { vi } from 'vitest'

import { Cluster, Redis } from 'ioredis'

import { config } from '#config/config.js'
import { buildRedisClient } from './redis-client.js'

const mockLoggerInfo = vi.fn()
const mockLoggerError = vi.fn()
const mockOn = vi.fn()

vi.mock('./logging/logger.js', () => ({
  createLogger: () => ({
    info: (...args) => mockLoggerInfo(...args),
    error: (...args) => mockLoggerError(...args)
  })
}))

vi.mock('ioredis', () => ({
  ...vi.importActual('ioredis'),
  Cluster: vi.fn(
    class {
      on = (...args) => mockOn(...args)
    }
  ),
  Redis: vi.fn(
    class {
      on = (...args) => mockOn(...args)
    }
  )
}))

describe('#buildRedisClient', () => {
  describe('When Redis Single InstanceCache is requested', () => {
    beforeEach(() => {
      const redisConfig = config.get('redis')
      buildRedisClient(redisConfig)
    })

    test('Should instantiate a single Redis client', () => {
      expect(Redis).toHaveBeenCalledWith({
        db: 0,
        host: '127.0.0.1',
        keyPrefix: 'epr-re-ex-admin-frontend:',
        port: 6379
      })
    })

    test('Should register connect event handler', () => {
      expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function))
    })

    test('Should register error event handler', () => {
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function))
    })

    test('Should log info message when connect event fires', () => {
      const connectCall = mockOn.mock.calls.find(
        (call) => call[0] === 'connect'
      )
      const connectHandler = connectCall[1]
      connectHandler()

      expect(mockLoggerInfo).toHaveBeenCalledWith('Connected to Redis server')
    })

    test('Should log error message when error event fires', () => {
      const errorCall = mockOn.mock.calls.find((call) => call[0] === 'error')
      const errorHandler = errorCall[1]
      const mockError = new Error('Connection failed')
      errorHandler(mockError)

      expect(mockLoggerError).toHaveBeenCalledWith(
        `Redis connection error ${mockError}`
      )
    })
  })

  describe('When a Redis Cluster is requested', () => {
    beforeEach(() => {
      buildRedisClient({
        ...config.get('redis'),
        useSingleInstanceCache: false,
        useTLS: true,
        username: 'user',
        password: 'pass'
      })
    })

    test('Should instantiate a Redis Cluster client', () => {
      expect(Cluster).toHaveBeenCalledWith(
        [{ host: '127.0.0.1', port: 6379 }],
        {
          dnsLookup: expect.any(Function),
          keyPrefix: 'epr-re-ex-admin-frontend:',
          redisOptions: { db: 0, password: 'pass', tls: {}, username: 'user' },
          slotsRefreshTimeout: 10000
        }
      )
    })

    test('Should configure dnsLookup to pass through address', () => {
      const clusterCall = Cluster.mock.calls[0]
      const config = clusterCall[1]
      const dnsLookup = config.dnsLookup
      const mockCallback = vi.fn()

      dnsLookup('test-address', mockCallback)

      expect(mockCallback).toHaveBeenCalledWith(null, 'test-address')
    })

    test('Should log info message when connect event fires', () => {
      const connectCall = mockOn.mock.calls.find(
        (call) => call[0] === 'connect'
      )
      const connectHandler = connectCall[1]
      connectHandler()

      expect(mockLoggerInfo).toHaveBeenCalledWith('Connected to Redis server')
    })

    test('Should log error message when error event fires', () => {
      const errorCall = mockOn.mock.calls.find((call) => call[0] === 'error')
      const errorHandler = errorCall[1]
      const mockError = new Error('Cluster connection failed')
      errorHandler(mockError)

      expect(mockLoggerError).toHaveBeenCalledWith(
        `Redis connection error ${mockError}`
      )
    })
  })
})
