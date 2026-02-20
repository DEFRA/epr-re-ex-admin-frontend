import { vi } from 'vitest'

const mockCreateAll = vi.fn()

vi.mock('govuk-frontend', () => ({
  createAll: mockCreateAll,
  Button: 'MockButton',
  Checkboxes: 'MockCheckboxes',
  ErrorSummary: 'MockErrorSummary',
  Radios: 'MockRadios',
  SkipLink: 'MockSkipLink'
}))

describe('#application', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('When module is loaded', () => {
    test('Should call createAll once for each component', async () => {
      await import('./application.js')

      expect(mockCreateAll).toHaveBeenCalledTimes(5)
      expect(mockCreateAll).toHaveBeenCalledWith('MockButton')
      expect(mockCreateAll).toHaveBeenCalledWith('MockCheckboxes')
      expect(mockCreateAll).toHaveBeenCalledWith('MockErrorSummary')
      expect(mockCreateAll).toHaveBeenCalledWith('MockRadios')
      expect(mockCreateAll).toHaveBeenCalledWith('MockSkipLink')
    })
  })
})
