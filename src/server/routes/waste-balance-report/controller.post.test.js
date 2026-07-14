import { fetchWasteBalanceReport } from './fetch-report.js'
import { wasteBalanceReportPostController } from './controller.post.js'

vi.mock('./fetch-report.js', () => ({
  fetchWasteBalanceReport: vi.fn()
}))

const report = {
  cutoff: '2026-05-31T23:00:00Z',
  totals: [
    {
      material: 'glass',
      wasteProcessingType: 'reprocessor',
      amount: 800,
      availableAmount: 700
    },
    {
      material: 'plastic',
      wasteProcessingType: 'exporter',
      amount: 1200.005,
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
      registrationNumber: '=SUM(A1)',
      accreditationNumber: 'ACC-457',
      material: 'plastic',
      wasteProcessingType: 'exporter',
      amount: 1200.005,
      availableAmount: 0
    }
  ]
}

describe('wasteBalanceReportPostController', () => {
  let mockRequest
  let mockH
  let response

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T12:00:00.000Z'))

    mockRequest = {
      payload: { month: '2026-05' },
      yar: {
        set: vi.fn()
      }
    }

    response = {
      header: vi.fn()
    }
    response.header.mockReturnValue(response)
    mockH = {
      response: vi.fn().mockReturnValue(response),
      redirect: vi.fn().mockReturnValue('redirected')
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('downloads the two-section CSV with its own header per section and raw numbers', async () => {
    vi.mocked(fetchWasteBalanceReport).mockResolvedValue(report)

    const result = await wasteBalanceReportPostController.handler(
      mockRequest,
      mockH
    )

    expect(result).toBe(response)

    expect(fetchWasteBalanceReport).toHaveBeenCalledWith(mockRequest, '2026-05')
    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toBe(
      [
        'material,type,total_balance,total_available_balance',
        'glass,reprocessor,800,700',
        'plastic,exporter,1200.005,900',
        '',
        'org_id,registration_number,accreditation_number,material,type,balance,available_balance',
        '500001,REG-123,ACC-456,glass,reprocessor,800,700',
        "500002,'=SUM(A1),ACC-457,plastic,exporter,1200.005,0"
      ].join('\n')
    )
  })

  it('names the file after the selected month and serves it as an attachment', async () => {
    vi.mocked(fetchWasteBalanceReport).mockResolvedValue(report)

    await wasteBalanceReportPostController.handler(mockRequest, mockH)

    expect(response.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(response.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="waste-balance-report-2026-05.csv"'
    )
  })

  it('downloads a headers-only CSV for an empty report', async () => {
    vi.mocked(fetchWasteBalanceReport).mockResolvedValue({
      cutoff: '2026-05-31T23:00:00Z',
      totals: [],
      accreditations: []
    })

    await wasteBalanceReportPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toBe(
      [
        'material,type,total_balance,total_available_balance',
        '',
        'org_id,registration_number,accreditation_number,material,type,balance,available_balance'
      ].join('\n')
    )
  })

  it('rejects the current, incomplete month', async () => {
    // Well-formed but out of range: July 2026 is the current month under the
    // pinned clock, so it has no closing balance yet.
    mockRequest.payload = { month: '2026-07' }

    await wasteBalanceReportPostController.handler(mockRequest, mockH)

    expect(fetchWasteBalanceReport).not.toHaveBeenCalled()
    expect(mockH.redirect).toHaveBeenCalledWith('/waste-balance-report')
  })

  it('rejects an invalid month with a flash error and a redirect', async () => {
    mockRequest.payload = { month: '2031-99' }

    const result = await wasteBalanceReportPostController.handler(
      mockRequest,
      mockH
    )

    expect(fetchWasteBalanceReport).not.toHaveBeenCalled()
    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Select a month from the list'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/waste-balance-report')
    expect(result).toBe('redirected')
  })

  it('rejects a missing payload', async () => {
    mockRequest.payload = undefined

    await wasteBalanceReportPostController.handler(mockRequest, mockH)

    expect(fetchWasteBalanceReport).not.toHaveBeenCalled()
    expect(mockH.redirect).toHaveBeenCalledWith('/waste-balance-report')
  })

  it('flashes an error and redirects back preserving the month when the backend fails', async () => {
    vi.mocked(fetchWasteBalanceReport).mockRejectedValue(
      new Error('backend down')
    )

    const result = await wasteBalanceReportPostController.handler(
      mockRequest,
      mockH
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the waste balance report. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith(
      '/waste-balance-report?month=2026-05'
    )
    expect(result).toBe('redirected')
  })
})
