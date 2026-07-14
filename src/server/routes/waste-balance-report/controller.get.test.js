import { statusCodes } from '#server/common/constants/status-codes.js'
import { fetchWasteBalanceReport } from './fetch-report.js'
import { wasteBalanceReportGetController } from './controller.get.js'

vi.mock('./fetch-report.js', () => ({
  fetchWasteBalanceReport: vi.fn()
}))

const VIEW = 'routes/waste-balance-report/index'

const report = {
  cutoff: '2026-06-30T23:00:00Z',
  totals: [
    {
      material: 'glass',
      wasteProcessingType: 'reprocessor',
      amount: 800,
      availableAmount: 700
    },
    {
      material: 'plastic',
      wasteProcessingType: 'reprocessor',
      amount: 1200.5,
      availableAmount: 900
    }
  ],
  accreditations: [
    {
      orgId: '500001',
      registrationNumber: 'REG-123',
      accreditationNumber: 'ACC-456',
      material: 'glass',
      wasteProcessingType: 'reprocessor',
      amount: 800,
      availableAmount: 700
    },
    {
      orgId: '500002',
      registrationNumber: 'REG-124',
      accreditationNumber: 'ACC-457',
      material: 'plastic',
      wasteProcessingType: 'reprocessor',
      amount: 1200.5,
      availableAmount: 0
    }
  ]
}

describe('wasteBalanceReportGetController', () => {
  let mockRequest
  let mockH
  let renderedWithCode

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T12:00:00.000Z'))

    mockRequest = {
      query: {},
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn()
      }
    }

    renderedWithCode = { code: vi.fn().mockReturnValue('rendered-with-code') }
    mockH = {
      view: vi.fn().mockReturnValue(renderedWithCode)
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders only the month form when no month is selected', async () => {
    await wasteBalanceReportGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      VIEW,
      expect.objectContaining({
        pageTitle: 'Waste balance report',
        months: expect.arrayContaining([
          expect.objectContaining({ value: '2026-06', selected: true })
        ])
      })
    )
    const context = mockH.view.mock.calls[0][1]
    expect(context.totalsRows).toBeUndefined()
    expect(context.accreditationRows).toBeUndefined()
    expect(fetchWasteBalanceReport).not.toHaveBeenCalled()
  })

  it('renders both tables and the download month for a valid month', async () => {
    mockRequest.query = { month: '2026-05' }
    vi.mocked(fetchWasteBalanceReport).mockResolvedValue(report)

    await wasteBalanceReportGetController.handler(mockRequest, mockH)

    expect(fetchWasteBalanceReport).toHaveBeenCalledWith(mockRequest, '2026-05')
    const context = mockH.view.mock.calls[0][1]
    expect(context.month).toBe('2026-05')
    expect(context.totalsRows).toEqual([
      [
        { text: 'glass' },
        { text: 'reprocessor' },
        { text: '800', format: 'numeric' },
        { text: '700', format: 'numeric' }
      ],
      [
        { text: 'plastic' },
        { text: 'reprocessor' },
        { text: '1,200.5', format: 'numeric' },
        { text: '900', format: 'numeric' }
      ]
    ])
    expect(context.accreditationRows).toEqual([
      [
        { text: '500001' },
        { text: 'REG-123' },
        { text: 'ACC-456' },
        { text: 'glass' },
        { text: 'reprocessor' },
        { text: '800', format: 'numeric' },
        { text: '700', format: 'numeric' }
      ],
      [
        { text: '500002' },
        { text: 'REG-124' },
        { text: 'ACC-457' },
        { text: 'plastic' },
        { text: 'reprocessor' },
        { text: '1,200.5', format: 'numeric' },
        { text: '0', format: 'numeric' }
      ]
    ])
  })

  it('marks the chosen month as selected when re-rendering a report', async () => {
    mockRequest.query = { month: '2026-03' }
    vi.mocked(fetchWasteBalanceReport).mockResolvedValue(report)

    await wasteBalanceReportGetController.handler(mockRequest, mockH)

    const context = mockH.view.mock.calls[0][1]
    const selected = context.months.filter((item) => item.selected)
    expect(selected).toEqual([
      expect.objectContaining({ value: '2026-03', selected: true })
    ])
  })

  it('renders empty tables for an empty report', async () => {
    mockRequest.query = { month: '2026-05' }
    vi.mocked(fetchWasteBalanceReport).mockResolvedValue({
      cutoff: '2026-05-31T23:00:00Z',
      totals: [],
      accreditations: []
    })

    await wasteBalanceReportGetController.handler(mockRequest, mockH)

    const context = mockH.view.mock.calls[0][1]
    expect(context.totalsRows).toEqual([])
    expect(context.accreditationRows).toEqual([])
  })

  it('rejects an invalid month with a 400 and an error message', async () => {
    mockRequest.query = { month: '2031-99' }

    const result = await wasteBalanceReportGetController.handler(
      mockRequest,
      mockH
    )

    expect(fetchWasteBalanceReport).not.toHaveBeenCalled()
    expect(mockH.view).toHaveBeenCalledWith(
      VIEW,
      expect.objectContaining({ error: 'Select a month from the list' })
    )
    expect(renderedWithCode.code).toHaveBeenCalledWith(statusCodes.badRequest)
    expect(result).toBe('rendered-with-code')
  })

  it('renders an error, keeping the month selected, when the backend fetch fails', async () => {
    mockRequest.query = { month: '2026-05' }
    vi.mocked(fetchWasteBalanceReport).mockRejectedValue(
      new Error('backend down')
    )

    await wasteBalanceReportGetController.handler(mockRequest, mockH)

    const context = mockH.view.mock.calls[0][1]
    expect(context.error).toBe(
      'There was a problem retrieving the waste balance report. Please try again.'
    )
    expect(context.totalsRows).toBeUndefined()
    expect(context.months).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: '2026-05', selected: true })
      ])
    )
  })

  it('shows and clears a flash error from the download controller', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')

    await wasteBalanceReportGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')
    expect(mockH.view).toHaveBeenCalledWith(
      VIEW,
      expect.objectContaining({ error: 'Download failed' })
    )
  })
})
