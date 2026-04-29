import { vi, describe, test, expect, beforeEach } from 'vitest'
import { reportSubmissionsPostController } from './controller.post.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: vi.fn() })
}))

const buildRow = (overrides = {}) => ({
  organisationName: 'Acme Ltd',
  submitterPhone: '01234567890',
  approvedPersonsPhone: '09876543210',
  submitterEmail: 'submitter@example.com',
  approvedPersonsEmail: 'ap@example.com',
  material: 'Plastic',
  registrationNumber: 'REG-001',
  accreditationNumber: '',
  reportType: 'Quarterly',
  reportingPeriod: 'Q1 2026',
  dueDate: '2026-04-20',
  submittedDate: '',
  submittedBy: '',
  tonnageReceivedForRecycling: '',
  tonnageRecycled: '',
  tonnageExportedForRecycling: '',
  tonnageSentOnTotal: '',
  tonnageSentOnToReprocessor: '',
  tonnageSentOnToExporter: '',
  tonnageSentOnToOtherFacilities: '',
  tonnagePrnsPernsIssued: '',
  totalRevenuePrnsPerns: '',
  averagePrnPernPricePerTonne: '',
  tonnageReceivedButNotRecycled: '',
  tonnageReceivedButNotExported: '',
  tonnageExportedThatWasStopped: '',
  tonnageExportedThatWasRefused: '',
  tonnageRepatriated: '',
  noteToRegulator: '',
  ...overrides
})

describe('reportSubmissionsPostController', () => {
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      yar: {
        set: vi.fn()
      }
    }

    mockResponse = {
      header: vi.fn().mockReturnThis()
    }

    mockH = {
      response: vi.fn().mockReturnValue(mockResponse),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
  })

  test('fetches data from the correct backend path', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/reports/submissions'
    )
  })

  test('sets Content-Type and Content-Disposition headers', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="report-submissions.csv"'
    )
  })

  test('CSV includes title row as first line', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    const firstLine = csv.split('\n')[0]
    expect(firstLine).toContain('Report submissions')
  })

  test('CSV includes the 12 column headers', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain('Organisation name')
    expect(csv).toContain('Organisation registered approver contact number')
    expect(csv).toContain(
      'Organisation registered approver person email address'
    )
    expect(csv).toContain('Organisation registered submitter contact number')
    expect(csv).toContain('Organisation registered submitter email address')
    expect(csv).toContain('Material')
    expect(csv).toContain('Accreditation No')
    expect(csv).toContain('Registered No')
    expect(csv).toContain('Report Type')
    expect(csv).toContain('Report Period')
    expect(csv).toContain('Due Date')
    expect(csv).toContain('Submitted Date')
    expect(csv).toContain('Submitted By')
  })

  test('CSV includes data rows', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [buildRow()],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain('Acme Ltd')
    expect(csv).toContain('REG-001')
    expect(csv).toContain('Quarterly')
    expect(csv).toContain('Q1 2026')
    expect(csv).toContain('2026-04-20')
  })

  test('sanitizes formula injection on organisationName', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [buildRow({ organisationName: '=SUM(A1)' })],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain("'=SUM(A1)")
  })

  test('CSV includes the 16 tonnage column headers', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain('Tonnage received for recycling')
    expect(csv).toContain('Tonnage recycled')
    expect(csv).toContain('Tonnage exported for recycling')
    expect(csv).toContain('Tonnage sent on, total')
    expect(csv).toContain('Tonnage sent on to a reprocessor')
    expect(csv).toContain('Tonnage sent on to an exporter')
    expect(csv).toContain('Tonnage sent on to other facilities')
    expect(csv).toContain('Tonnage of PRNs/PERNs issued')
    expect(csv).toContain('Total revenue from PRNs/PERNs')
    expect(csv).toContain('Average PRN/PERN price per tonne')
    expect(csv).toContain('Tonnage received but not recycled')
    expect(csv).toContain('Tonnage received but not exported')
    expect(csv).toContain('Tonnage exported that was stopped')
    expect(csv).toContain('Tonnage exported that was refused')
    expect(csv).toContain('Tonnage repatriated')
    expect(csv).toContain('Note to regulator')
  })

  test('CSV maps tonnage field values into data row', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [
        buildRow({
          tonnageReceivedForRecycling: '100.5',
          tonnageRecycled: '80',
          tonnageExportedForRecycling: '20.25',
          tonnageSentOnTotal: '15',
          tonnageSentOnToReprocessor: '5',
          tonnageSentOnToExporter: '7',
          tonnageSentOnToOtherFacilities: '3',
          tonnagePrnsPernsIssued: '90',
          totalRevenuePrnsPerns: '4500',
          averagePrnPernPricePerTonne: '50',
          tonnageReceivedButNotRecycled: '19.5',
          tonnageReceivedButNotExported: '0',
          tonnageExportedThatWasStopped: '1',
          tonnageExportedThatWasRefused: '2',
          tonnageRepatriated: '0.5',
          noteToRegulator: 'All good'
        })
      ],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain('100.5')
    expect(csv).toContain('80')
    expect(csv).toContain('20.25')
    expect(csv).toContain('All good')
  })

  test('sanitizes formula injection on noteToRegulator', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [buildRow({ noteToRegulator: '=HYPERLINK("evil")' })],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain("'=HYPERLINK")
    expect(csv).not.toContain('=HYPERLINK("evil")')
  })

  test('sanitizes formula injection on submittedBy', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [buildRow({ submittedBy: '+DANGEROUS()' })],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain("'+DANGEROUS()")
  })

  test('redirects with error message when fetch fails', async () => {
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await reportSubmissionsPostController.handler(
      mockRequest,
      mockH
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the report submissions data. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/report-submissions')
    expect(result).toBe('redirect-response')
  })

  test('uses error message from backend payload when available', async () => {
    const error = new Error('Backend error')
    error.output = { payload: { message: 'Custom backend error' } }
    fetchJsonFromBackend.mockRejectedValue(error)

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error'
    )
  })

  test('handles empty reportSubmissions array', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      reportSubmissions: [],
      generatedAt: '2026-04-17T10:00:00.000Z'
    })

    await reportSubmissionsPostController.handler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalled()
    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
  })
})
