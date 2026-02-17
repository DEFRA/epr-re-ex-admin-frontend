import { vi } from 'vitest'
import { prnActivityController, buildPrnApiUrl } from './controller.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const expectedStatuses =
  'awaiting_authorisation,awaiting_acceptance,accepted,awaiting_cancellation,cancelled,deleted'

describe('prn-activity controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      query: {},
      route: {
        settings: {
          app: { pageTitle: 'PRN activity' }
        }
      },
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn()
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('Should fetch PRNs with correct statuses', async () => {
    fetchJsonFromBackend.mockResolvedValue({ items: [] })

    await prnActivityController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      `/v1/admin/packaging-recycling-notes?statuses=${expectedStatuses}`
    )
  })

  test('Should render view with pageTitle and mapped PRNs', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          prnNumber: 'PRN-001',
          status: 'awaiting_acceptance',
          issuedToOrganisation: { name: 'Org A' },
          tonnage: 100,
          material: 'Glass',
          processToBeUsed: 'R3',
          isDecemberWaste: true,
          notes: 'Test notes',
          issuedAt: '2025-06-15T10:30:00.000Z',
          issuedBy: { name: 'John', position: 'Manager' },
          accreditationYear: 2025,
          organisationName: 'Reprocessor Ltd',
          wasteProcessingType: 'reprocessor'
        }
      ]
    })

    await prnActivityController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/prn-activity/index', {
      pageTitle: 'PRN activity',
      prns: [
        expect.objectContaining({
          prnNumber: 'PRN-001',
          status: 'awaiting_acceptance',
          issuedTo: 'Org A',
          tonnage: 100,
          material: 'Glass',
          processToBeUsed: 'R3',
          isDecemberWaste: 'Yes',
          notes: 'Test notes',
          organisationName: 'Reprocessor Ltd',
          wasteProcessingType: 'reprocessor'
        })
      ],
      pagination: {},
      page: 1,
      error: null
    })
  })

  test('Should map isDecemberWaste false to No', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          prnNumber: 'PRN-001',
          status: 'accepted',
          tonnage: 50,
          isDecemberWaste: false
        }
      ]
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.prns[0].isDecemberWaste).toBe('No')
  })

  test('Should handle null/undefined optional fields', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          status: 'awaiting_authorisation',
          tonnage: 10
        }
      ]
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.prns[0].prnNumber).toBe('')
    expect(viewArgs.prns[0].material).toBe('')
    expect(viewArgs.prns[0].notes).toBe('')
    expect(viewArgs.prns[0].issuedAt).toBe('')
    expect(viewArgs.prns[0].issuedByName).toBe('')
    expect(viewArgs.prns[0].issuedByPosition).toBe('')
    expect(viewArgs.prns[0].organisationName).toBe('')
    expect(viewArgs.prns[0].wasteProcessingType).toBe('')
    expect(viewArgs.prns[0].processToBeUsed).toBe('')
  })

  test('Should handle empty items array', async () => {
    fetchJsonFromBackend.mockResolvedValue({ items: [] })

    await prnActivityController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/prn-activity/index', {
      pageTitle: 'PRN activity',
      prns: [],
      pagination: {},
      page: 1,
      error: null
    })
  })

  test('Should handle null data from backend', async () => {
    fetchJsonFromBackend.mockResolvedValue(null)

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.prns).toEqual([])
  })

  test('Should use tradingName over name for issuedToOrganisation', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          status: 'accepted',
          tonnage: 10,
          issuedToOrganisation: {
            name: 'Legal Name',
            tradingName: 'Trading Name'
          }
        }
      ]
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.prns[0].issuedTo).toBe('Trading Name')
  })

  test('Should use name when tradingName is empty string', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          status: 'accepted',
          tonnage: 10,
          issuedToOrganisation: { name: 'Legal Name', tradingName: '' }
        }
      ]
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.prns[0].issuedTo).toBe('Legal Name')
  })

  test('Should use name when tradingName is not present', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          status: 'accepted',
          tonnage: 10,
          issuedToOrganisation: { name: 'Legal Name' }
        }
      ]
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.prns[0].issuedTo).toBe('Legal Name')
  })

  test('Should return empty string when org has no name or tradingName', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          status: 'accepted',
          tonnage: 10,
          issuedToOrganisation: {}
        }
      ]
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.prns[0].issuedTo).toBe('')
  })

  test('Should display error message from session and clear it', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')
    fetchJsonFromBackend.mockResolvedValue({ items: [] })

    await prnActivityController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/prn-activity/index',
      expect.objectContaining({
        error: 'Download failed'
      })
    )
  })

  test('Should return empty string when issuedToOrganisation is null', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          status: 'accepted',
          tonnage: 10,
          issuedToOrganisation: null
        }
      ]
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.prns[0].issuedTo).toBe('')
  })

  test('Should pass cursor to backend when provided in query', async () => {
    mockRequest.query.cursor = 'abc123'
    fetchJsonFromBackend.mockResolvedValue({ items: [] })

    await prnActivityController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      `/v1/admin/packaging-recycling-notes?statuses=${expectedStatuses}&cursor=abc123`
    )
  })

  test('Should include next pagination link when hasMore is true', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [{ status: 'accepted', tonnage: 10 }],
      hasMore: true,
      nextCursor: 'cursor-xyz'
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.pagination.next).toEqual({
      href: '/prn-activity?cursor=cursor-xyz&page=2'
    })
  })

  test('Should include previous pagination link when cursor is provided', async () => {
    mockRequest.query.cursor = 'abc123'
    mockRequest.query.page = '2'
    fetchJsonFromBackend.mockResolvedValue({
      items: [{ status: 'accepted', tonnage: 10 }],
      hasMore: false
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.pagination.previous).toEqual({
      href: '/prn-activity'
    })
    expect(viewArgs.pagination.next).toBeUndefined()
  })

  test('Should not include pagination links on first page with no more results', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      items: [{ status: 'accepted', tonnage: 10 }],
      hasMore: false
    })

    await prnActivityController.handler(mockRequest, mockH)

    const viewArgs = mockH.view.mock.calls[0][1]
    expect(viewArgs.pagination).toEqual({})
  })
})

describe('buildPrnApiUrl', () => {
  test('Should build URL without cursor when not provided', () => {
    const url = buildPrnApiUrl(null)
    expect(url).toBe(
      `/v1/admin/packaging-recycling-notes?statuses=${expectedStatuses}`
    )
  })

  test('Should build URL with cursor when provided', () => {
    const url = buildPrnApiUrl('abc123')
    expect(url).toBe(
      `/v1/admin/packaging-recycling-notes?statuses=${expectedStatuses}&cursor=abc123`
    )
  })

  test('Should encode cursor value', () => {
    const url = buildPrnApiUrl('abc 123')
    expect(url).toContain('cursor=abc%20123')
  })
})
