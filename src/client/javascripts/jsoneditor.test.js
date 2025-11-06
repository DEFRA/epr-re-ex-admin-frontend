import { vi } from 'vitest'

const mockInitJSONEditor = vi.fn()

vi.mock('./jsoneditor.helpers.js', () => ({
  initJSONEditor: mockInitJSONEditor
}))

const mockValidate = vi.fn()
const mockSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' }
  }
}

vi.mock('#server/common/schemas/organisation.ajv.js', () => ({
  default: mockValidate
}))

vi.mock('#server/common/schemas/organisation.json', () => ({
  default: mockSchema
}))

describe('#jsoneditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('When module is loaded', () => {
    test('Should call initJSONEditor with correct parameters', async () => {
      await import('./jsoneditor.js')

      expect(mockInitJSONEditor).toHaveBeenCalledTimes(1)
      expect(mockInitJSONEditor).toHaveBeenCalledWith({
        schema: mockSchema,
        validate: mockValidate,
        storageKey: 'organisation-jsoneditor-draft'
      })
    })
  })
})
