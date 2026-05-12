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

    test('Should log error with structured err key and message', () => {
      expect(mockLoggerError).toHaveBeenCalledWith({
        err: mockError,
        message: 'Unhandled rejection'
      })
    })

    test('Should not log a separate info message', () => {
      expect(mockLoggerInfo).not.toHaveBeenCalled()
    })

    test('Should set process exitCode to 1', () => {
      expect(process.exitCode).toBe(1)
    })
  })

  describe('When unhandledRejection occurs with a non-Error reason', () => {
    beforeEach(async () => {
      await import('./index.js')

      process.emit('unhandledRejection', 'plain string rejection')
    })

    test('Should wrap the reason in an Error before logging', () => {
      expect(mockLoggerError).toHaveBeenCalledWith({
        err: expect.any(Error),
        message: 'Unhandled rejection'
      })

      const [{ err }] = mockLoggerError.mock.calls[0]

      expect(err.message).toBe('plain string rejection')
    })

    test('Should set process exitCode to 1', () => {
      expect(process.exitCode).toBe(1)
    })
  })
})
