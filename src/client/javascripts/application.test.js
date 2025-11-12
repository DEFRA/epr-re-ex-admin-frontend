import { describe, test, expect, beforeEach, vi } from 'vitest'

const mockCreateAll = vi.fn()

vi.mock('govuk-frontend', () => ({
  createAll: mockCreateAll,
  Button: 'MockButton',
  Checkboxes: 'MockCheckboxes',
  ErrorSummary: 'MockErrorSummary',
  Header: 'MockHeader',
  Radios: 'MockRadios',
  SkipLink: 'MockSkipLink'
}))

describe('#application', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('When module is loaded', () => {
    test('Should call createAll once for each component', async () => {
      // Need to reset modules to ensure fresh import
      vi.resetModules()
      await import('./application.js')

      expect(mockCreateAll).toHaveBeenCalledTimes(6)
      expect(mockCreateAll).toHaveBeenCalledWith('MockButton')
      expect(mockCreateAll).toHaveBeenCalledWith('MockCheckboxes')
      expect(mockCreateAll).toHaveBeenCalledWith('MockErrorSummary')
      expect(mockCreateAll).toHaveBeenCalledWith('MockHeader')
      expect(mockCreateAll).toHaveBeenCalledWith('MockRadios')
      expect(mockCreateAll).toHaveBeenCalledWith('MockSkipLink')
    })
  })
})
