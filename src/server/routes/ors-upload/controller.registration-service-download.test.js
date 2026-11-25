import { vi } from 'vitest'
import Boom from '@hapi/boom'

import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { registrationServiceDownloadController } from './controller.registration-service-download.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockFetchJsonFromBackend = vi.mocked(fetchJsonFromBackend)

const site = {
  orgId: 500001,
  registrationNumber: 'R25SR5000010001PA',
  packagingWasteCategory: 'paper',
  year: 2026,
  applicationReference: 'APP-123',
  applicationStatus: 'submitted',
  accreditationNumber: 'ACC5000010001',
  siteId: 'site-1',
  orsId: '001',
  selected: true,
  overseasReprocessorName: 'Alpha Reprocessor',
  formattedAddress: '1 Rue de Test, Paris',
  destinationCountry: 'France',
  addressLine1: '1 Rue de Test',
  addressLine2: 'Zone 2',
  cityOrTown: 'Paris',
  coordinates: '48.8566,2.3522'
}

describe('registrationServiceDownloadController', () => {
  let mockRequest
  let mockH
  let mockResponse

  const downloadCsv = async () => {
    await registrationServiceDownloadController.handler(mockRequest, mockH)
    return mockH.response.mock.calls[0][0]
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = { yar: { set: vi.fn() } }
    mockResponse = { header: vi.fn().mockReturnThis() }
    mockH = {
      response: vi.fn().mockReturnValue(mockResponse),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
  })

  test('Should fetch the registration service overseas sites from the backend', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({ rows: [] })

    await registrationServiceDownloadController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/registration-service/overseas-sites'
    )
  })

  test('Should write the overseas sites columns followed by the application columns', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({ rows: [site] })

    const [header, row] = (await downloadCsv()).split('\n')

    expect(header).toBe(
      '﻿Org ID,Registration Number,Accreditation Number,ORS ID,Packaging waste category,Destination country,Overseas reprocessor name,Address line 1,Address line 2,City or town,"State, province or region",Postcode or similar,Coordinates,Valid from,Application reference,Application status,Year,Selected,Site ID,Formatted address'
    )
    expect(row).toBe(
      '500001,R25SR5000010001PA,ACC5000010001,001,paper,France,Alpha Reprocessor,1 Rue de Test,Zone 2,Paris,,,"48.8566,2.3522",,APP-123,submitted,2026,Yes,site-1,"1 Rue de Test, Paris"'
    )
  })

  test('Should write No for a site that is not selected and blanks for missing values', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      rows: [
        {
          ...site,
          selected: false,
          applicationReference: null,
          accreditationNumber: null,
          orsId: null,
          formattedAddress: null
        }
      ]
    })

    const [, row] = (await downloadCsv()).split('\n')

    expect(row).toBe(
      '500001,R25SR5000010001PA,,,paper,France,Alpha Reprocessor,1 Rue de Test,Zone 2,Paris,,,"48.8566,2.3522",,,submitted,2026,No,site-1,'
    )
  })

  test('Should prefix formula-like values in the application columns', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      rows: [{ ...site, applicationReference: '=HYPERLINK("x")' }]
    })

    expect(await downloadCsv()).toContain(`'=HYPERLINK`)
  })

  test('Should write only the header when the backend returns no rows', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({})

    expect((await downloadCsv()).split('\n')).toHaveLength(1)
  })

  test('Should name the file as the registration service download', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({ rows: [] })

    await registrationServiceDownloadController.handler(mockRequest, mockH)

    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv; charset=utf-8'
    )
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="overseas-reprocessing-sites-registration-service.csv"'
    )
  })

  test.each([
    [
      Boom.badGateway(),
      'The registration service did not respond. Please try again later.'
    ],
    [
      Boom.serverUnavailable(),
      'The registration service is not connected in this environment.'
    ],
    [
      new Error('Network error'),
      'There was a problem downloading the registration service overseas reprocessing site data. Please try again.'
    ]
  ])(
    'Should redirect to the overseas sites page with a plain error when the download fails with %s',
    async (error, message) => {
      mockFetchJsonFromBackend.mockRejectedValue(error)

      const result = await registrationServiceDownloadController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith('error', message)
      expect(mockH.redirect).toHaveBeenCalledWith('/overseas-sites')
      expect(result).toBe('redirect-response')
    }
  )
})
