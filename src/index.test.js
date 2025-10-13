import { vi } from 'vitest'

const mockStartServer = vi.fn()
const mockLoggerInfo = vi.fn()
const mockLoggerError = vi.fn()
const mockCreateLogger = vi.fn()

vi.mock('./server/common/helpers/start-server.js', () => ({
  startServer: mockStartServer
}))

vi.mock('./server/common/helpers/logging/logger.js', () => ({
  createLogger: mockCreateLogger
}))

describe('#index', () => {
  let originalExitCode

  beforeAll(() => {
    mockCreateLogger.mockReturnValue({
      info: mockLoggerInfo,
      error: mockLoggerError
    })
    mockStartServer.mockResolvedValue()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    originalExitCode = process.exitCode
    process.exitCode = undefined
  })

  afterEach(() => {
    process.exitCode = originalExitCode
  })

  describe('When module is loaded', () => {
    test('Should call startServer', async () => {
      await import('./index.js')

      expect(mockStartServer).toHaveBeenCalled()
    })
  })

  describe('When unhandledRejection occurs', () => {
    const mockError = new Error('Test unhandled rejection')

    beforeEach(async () => {
      await import('./index.js')

      process.emit('unhandledRejection', mockError)
    })

    test('Should create logger', () => {
      expect(mockCreateLogger).toHaveBeenCalled()
    })

    test('Should log unhandled rejection info message', () => {
      expect(mockLoggerInfo).toHaveBeenCalledWith('Unhandled rejection')
    })

    test('Should log error', () => {
      expect(mockLoggerError).toHaveBeenCalledWith(mockError)
    })

    test('Should set process exitCode to 1', () => {
      expect(process.exitCode).toBe(1)
    })
  })
})
