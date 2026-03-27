import { vi } from 'vitest'

import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { orsDownloadController } from './controller.download.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('orsDownloadController', () => {
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

  test('Should fetch all ORS rows from the backend', async () => {
    fetchJsonFromBackend.mockResolvedValue({ rows: [] })

    await orsDownloadController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/overseas-sites?all=true'
    )
  })

  test('Should preserve registrationNumber filter when downloading CSV', async () => {
    mockRequest.payload = {
      registrationNumber: ' REG-123 '
    }
    fetchJsonFromBackend.mockResolvedValue({ rows: [] })

    await orsDownloadController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/overseas-sites?all=true&registrationNumber=REG-123'
    )
  })

  test('Should generate CSV with correct headers and row data', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      rows: [
        {
          orgId: 500001,
          registrationNumber: 'R25SR5000010001PA',
          accreditationNumber: 'ACC5000010001',
          orsId: '001',
          packagingWasteCategory: 'paper',
          destinationCountry: 'France',
          overseasReprocessorName: 'Alpha Reprocessor',
          addressLine1: '1 Rue de Test',
          addressLine2: 'Zone 2',
          cityOrTown: 'Paris',
          stateProvinceOrRegion: 'Ile-de-France',
          postcode: '75001',
          coordinates: '48.8566,2.3522',
          validFrom: '2025-04-01T00:00:00.000Z'
        }
      ]
    })

    await orsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')

    expect(lines[0]).toBe(
      '\uFEFF"Org ID","Registration Number","Accreditation Number","ORS ID","Packaging waste category","Destination country","Overseas reprocessor name","Address line 1","Address line 2","City or town","State, province or region","Postcode or similar","Coordinates","Valid from"'
    )
    expect(csvContent).toContain('500001')
    expect(csvContent).toContain('Alpha Reprocessor')
    expect(csvContent).toContain('1 April 2025')
  })

  test('Should preserve UTF-8 coordinate symbols in the CSV payload', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      rows: [
        {
          orgId: 500001,
          orsId: '001',
          coordinates: '22°48\'00.0"N 86°11\'00.0"E'
        }
      ]
    })

    await orsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]

    expect(csvContent.startsWith('\uFEFF')).toBe(true)
    expect(csvContent).toContain('22°48\'00.0""N 86°11\'00.0""E')
    expect(csvContent).not.toContain('Â°')
  })

  test('Should handle legacy array payloads', async () => {
    fetchJsonFromBackend.mockResolvedValue([
      {
        orgId: 500001,
        orsId: '001'
      }
    ])

    await orsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('500001')
    expect(csvContent).toContain('001')
  })

  test('Should handle empty backend rows', async () => {
    fetchJsonFromBackend.mockResolvedValue({ rows: [] })

    await orsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('Org ID')
  })

  test('Should handle missing rows payload', async () => {
    fetchJsonFromBackend.mockResolvedValue({})

    await orsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent.split('\n')).toHaveLength(1)
  })

  test('Should return blank values for null and invalid dates', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      rows: [
        {
          orgId: null,
          registrationNumber: null,
          accreditationNumber: null,
          orsId: '001',
          packagingWasteCategory: null,
          destinationCountry: null,
          overseasReprocessorName: null,
          addressLine1: null,
          addressLine2: null,
          cityOrTown: null,
          stateProvinceOrRegion: null,
          postcode: null,
          coordinates: null,
          validFrom: 'not-a-date'
        }
      ]
    })

    await orsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"","","","001"')
    expect(csvContent.trimEnd().endsWith('""')).toBe(true)
  })

  test('Should prefix formula-like string values', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      rows: [
        {
          orgId: '=SUM(A1)',
          registrationNumber: '@cmd',
          accreditationNumber: '+123',
          orsId: '001',
          packagingWasteCategory: '-paper'
        }
      ]
    })

    await orsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain("'=SUM(A1)")
    expect(csvContent).toContain("'@cmd")
    expect(csvContent).toContain("'+123")
    expect(csvContent).toContain("'-paper")
  })

  test('Should set correct Content-Type and Content-Disposition headers', async () => {
    fetchJsonFromBackend.mockResolvedValue({ rows: [] })

    await orsDownloadController.handler(mockRequest, mockH)

    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv; charset=utf-8'
    )
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="overseas-reprocessing-sites.csv"'
    )
  })

  test('Should redirect with default error message on fetch failure', async () => {
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await orsDownloadController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the overseas reprocessing site data. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/overseas-sites')
    expect(result).toBe('redirect-response')
  })

  test('Should preserve registrationNumber on redirect after download failure', async () => {
    mockRequest.payload = {
      registrationNumber: 'REG-123'
    }
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    await orsDownloadController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(
      '/overseas-sites?registrationNumber=REG-123'
    )
  })

  test('Should use backend error message when available', async () => {
    const error = new Error('Backend error')
    error.output = { payload: { message: 'Custom backend error message' } }
    fetchJsonFromBackend.mockRejectedValue(error)

    await orsDownloadController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error message'
    )
  })
})
