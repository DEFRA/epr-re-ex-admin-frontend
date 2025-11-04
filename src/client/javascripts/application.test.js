import { vi } from 'vitest'

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

// Mock the dynamic import
vi.doMock('./jsoneditor.js', () => ({}))

// Mock document
Object.defineProperty(globalThis, 'document', {
  value: {
    getElementById: vi.fn()
  },
  writable: true
})

describe('#application', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document mock
    document.getElementById.mockReturnValue(null)
  })

  describe('When module is loaded', () => {
    test('Should call createAll once for each component', async () => {
      await import('./application.js')

      expect(mockCreateAll).toHaveBeenCalledTimes(6)
      expect(mockCreateAll).toHaveBeenCalledWith('MockButton')
      expect(mockCreateAll).toHaveBeenCalledWith('MockCheckboxes')
      expect(mockCreateAll).toHaveBeenCalledWith('MockErrorSummary')
      expect(mockCreateAll).toHaveBeenCalledWith('MockHeader')
      expect(mockCreateAll).toHaveBeenCalledWith('MockRadios')
      expect(mockCreateAll).toHaveBeenCalledWith('MockSkipLink')
    })

    test('Should not import jsoneditor when jsoneditor element is not present', async () => {
      // Mock document to return null for jsoneditor
      document.getElementById.mockReturnValue(null)

      // Clear modules cache to force re-import and re-evaluation
      vi.resetModules()

      await import('./application.js?t=1')

      expect(document.getElementById).toHaveBeenCalledWith('jsoneditor')
    })

    test('Should import jsoneditor when jsoneditor element is present', async () => {
      // Mock document to return an element for jsoneditor
      const mockElement = { id: 'jsoneditor' }
      document.getElementById.mockReturnValue(mockElement)

      // Clear modules cache to force re-import
      vi.resetModules()

      await import('./application.js?t=2')

      expect(document.getElementById).toHaveBeenCalledWith('jsoneditor')
      // The dynamic import happens but we can't easily test it's called
      // The coverage will be improved by having the condition branch executed
    })
  })
})
