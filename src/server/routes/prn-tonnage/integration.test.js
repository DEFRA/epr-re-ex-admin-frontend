import { vi, beforeEach } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import * as cheerio from 'cheerio'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('prn-tonnage results table', () => {
  const backendUrl = config.get('eprBackendUrl')
  let server

  beforeAll(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const stubBackendResponse = (data) => {
    mswServer.use(
      http.get(`${backendUrl}/v1/prn-tonnage`, () => HttpResponse.json(data))
    )
  }

  const mockPrnTonnageData = {
    generatedAt: '2026-01-29T14:30:00.000Z',
    rows: [
      {
        organisationName: 'Acme Reprocessing',
        organisationId: 'org-1',
        registrationNumber: 'REG-100',
        registrationType: 'REPROCESSOR_OUTPUT',
        accreditationNumber: 'ACC-100',
        material: 'plastic',
        tonnageBand: 'up_to_5000',
        wasteBalance: 750,
        availableWasteBalance: 600,
        awaitingAuthorisationTonnage: 10,
        awaitingAcceptanceTonnage: 20,
        awaitingCancellationTonnage: 30,
        acceptedTonnage: 40,
        cancelledTonnage: 50
      }
    ]
  }

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
  })

  const renderResults = async () => {
    stubBackendResponse(mockPrnTonnageData)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/prn-tonnage/results',
      auth: {
        strategy: 'session',
        credentials: mockUserSession
      }
    })

    expect(statusCode).toBe(statusCodes.ok)

    return cheerio.load(result)
  }

  const cellsOf = ($, selector) =>
    $(selector)
      .map((_, cell) => $(cell).text().trim())
      .get()

  test('Should render the columns in hierarchy order', async () => {
    const $ = await renderResults()

    expect(cellsOf($, '.govuk-table thead th')).toEqual([
      'Organisation Name',
      'Organisation ID',
      'Registration Number',
      'Registration Type',
      'Accreditation Number',
      'Material',
      'Tonnage Band',
      'Waste balance',
      'Available waste balance',
      'Awaiting authorisation',
      'Awaiting acceptance',
      'Awaiting cancellation',
      'Accepted',
      'Cancelled'
    ])
  })

  test('Should render each row under the heading that names it', async () => {
    const $ = await renderResults()

    expect(cellsOf($, '.govuk-table tbody tr:first-child td')).toEqual([
      'Acme Reprocessing',
      'org-1',
      'REG-100',
      'Reprocessor output',
      'ACC-100',
      'Plastic',
      'Up to 5,000 tonnes',
      '750',
      '600',
      '10',
      '20',
      '30',
      '40',
      '50'
    ])
  })

  test('Should right-align the figures in both the heading and the cell', async () => {
    const $ = await renderResults()
    const numericFrom = (row) =>
      $(row)
        .children()
        .map(
          (_, cell) =>
            $(cell).hasClass('govuk-table__header--numeric') ||
            $(cell).hasClass('govuk-table__cell--numeric')
        )
        .get()

    const alignedColumns = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ]

    expect(numericFrom('.govuk-table thead tr')).toEqual(alignedColumns)
    expect(numericFrom('.govuk-table tbody tr:first-child')).toEqual(
      alignedColumns
    )
  })
})
