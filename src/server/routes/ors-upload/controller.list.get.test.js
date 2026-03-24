import { beforeEach, describe, expect, test, vi } from 'vitest'

import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { orsListGetController } from './controller.list.get.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockLoggerError = vi.hoisted(() => vi.fn())

vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    error: mockLoggerError
  }))
}))

describe('orsListGetController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      query: {},
      route: {
        settings: {
          app: {
            pageTitle: 'Overseas reprocessing sites'
          }
        }
      }
    }

    mockH = {
      view: vi.fn()
    }
  })

  test('loads ORS data and maps null values for display', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      rows: [
        {
          orsId: '001',
          packagingWasteCategory: 'paper',
          orgId: 500001,
          registrationNumber: 'R25SR5000010001PA',
          accreditationNumber: 'ACC5000010001',
          destinationCountry: 'France',
          overseasReprocessorName: 'Alpha Reprocessor',
          addressLine1: '1 Rue de Test',
          addressLine2: null,
          cityOrTown: 'Paris',
          stateProvinceOrRegion: null,
          postcode: '',
          coordinates: null,
          validFrom: '2025-04-01T00:00:00.000Z'
        },
        {
          orsId: '002',
          packagingWasteCategory: null,
          orgId: undefined,
          registrationNumber: '',
          accreditationNumber: null,
          destinationCountry: undefined,
          overseasReprocessorName: 'Beta Reprocessor',
          addressLine1: '2 Teststrasse',
          cityOrTown: 'Berlin'
        },
        {
          orsId: '003',
          packagingWasteCategory: 'plastic',
          orgId: 500003,
          registrationNumber: 'R25SR5000030003PL',
          accreditationNumber: undefined,
          destinationCountry: 'Spain',
          overseasReprocessorName: 'Gamma Reprocessor',
          addressLine1: '3 Calle Test',
          cityOrTown: 'Madrid',
          validFrom: 'not-a-date'
        }
      ],
      pagination: {
        page: 1,
        pageSize: 50,
        totalItems: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    })

    await orsListGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/overseas-sites?page=1&pageSize=50'
    )

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [
        {
          orsId: '001',
          packagingWasteCategory: 'paper',
          orgId: 500001,
          registrationNumber: 'R25SR5000010001PA',
          accreditationNumber: 'ACC5000010001',
          destinationCountry: 'France',
          overseasReprocessorName: 'Alpha Reprocessor',
          addressLine1: '1 Rue de Test',
          addressLine2: '-',
          cityOrTown: 'Paris',
          stateProvinceOrRegion: '-',
          postcode: '-',
          coordinates: '-',
          validFromDisplay: '1 April 2025'
        },
        {
          orsId: '002',
          packagingWasteCategory: '-',
          orgId: '-',
          registrationNumber: '-',
          accreditationNumber: '-',
          destinationCountry: '-',
          overseasReprocessorName: 'Beta Reprocessor',
          addressLine1: '2 Teststrasse',
          addressLine2: '-',
          cityOrTown: 'Berlin',
          stateProvinceOrRegion: '-',
          postcode: '-',
          coordinates: '-',
          validFromDisplay: '-'
        },
        {
          orsId: '003',
          packagingWasteCategory: 'plastic',
          orgId: 500003,
          registrationNumber: 'R25SR5000030003PL',
          accreditationNumber: '-',
          destinationCountry: 'Spain',
          overseasReprocessorName: 'Gamma Reprocessor',
          addressLine1: '3 Calle Test',
          addressLine2: '-',
          cityOrTown: 'Madrid',
          stateProvinceOrRegion: '-',
          postcode: '-',
          coordinates: '-',
          validFromDisplay: '-'
        }
      ],
      pagination: {},
      page: 1,
      totalPages: 1,
      error: null
    })
  })

  test('returns empty rows when backend returns no values', async () => {
    fetchJsonFromBackend.mockResolvedValue(undefined)

    await orsListGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [],
      pagination: {},
      page: 1,
      totalPages: 0,
      error: null
    })
  })

  test('returns empty rows when backend returns non-array payload', async () => {
    fetchJsonFromBackend.mockResolvedValue(null)

    await orsListGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [],
      pagination: {},
      page: 1,
      totalPages: 0,
      error: null
    })
  })

  test('supports legacy array payloads with pagination fallback metadata', async () => {
    mockRequest.query = {
      page: 'invalid',
      pageSize: 'invalid'
    }

    fetchJsonFromBackend.mockResolvedValue([
      {
        orsId: '010'
      }
    ])

    await orsListGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/overseas-sites?page=1&pageSize=50'
    )

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [
        {
          orsId: '010',
          packagingWasteCategory: '-',
          orgId: '-',
          registrationNumber: '-',
          accreditationNumber: '-',
          destinationCountry: '-',
          overseasReprocessorName: '-',
          addressLine1: '-',
          addressLine2: '-',
          cityOrTown: '-',
          stateProvinceOrRegion: '-',
          postcode: '-',
          coordinates: '-',
          validFromDisplay: '-'
        }
      ],
      pagination: {},
      page: 1,
      totalPages: 1,
      error: null
    })
  })

  test('returns empty rows for non-array rows payload in object response', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      rows: {},
      pagination: {
        page: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    })

    await orsListGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [],
      pagination: {},
      page: 1,
      totalPages: 0,
      error: null
    })
  })

  test('supports legacy empty array payloads with zero total pages', async () => {
    fetchJsonFromBackend.mockResolvedValue([])

    await orsListGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [],
      pagination: {},
      page: 1,
      totalPages: 0,
      error: null
    })
  })

  test('builds previous and next pagination links from backend metadata', async () => {
    mockRequest.query = {
      page: '2',
      pageSize: '2'
    }

    fetchJsonFromBackend.mockResolvedValue({
      rows: [{ orsId: '002' }],
      pagination: {
        page: 2,
        pageSize: 2,
        totalItems: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true
      }
    })

    await orsListGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/overseas-sites?page=2&pageSize=2'
    )

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [
        {
          orsId: '002',
          packagingWasteCategory: '-',
          orgId: '-',
          registrationNumber: '-',
          accreditationNumber: '-',
          destinationCountry: '-',
          overseasReprocessorName: '-',
          addressLine1: '-',
          addressLine2: '-',
          cityOrTown: '-',
          stateProvinceOrRegion: '-',
          postcode: '-',
          coordinates: '-',
          validFromDisplay: '-'
        }
      ],
      pagination: {
        previous: {
          href: '/overseas-sites?page=1&pageSize=2'
        },
        next: {
          href: '/overseas-sites?page=3&pageSize=2'
        }
      },
      page: 2,
      totalPages: 3,
      error: null
    })
  })

  test('handles backend failure and renders error message', async () => {
    const error = new Error('Backend unavailable')
    fetchJsonFromBackend.mockRejectedValue(error)

    await orsListGetController.handler(mockRequest, mockH)

    expect(mockLoggerError).toHaveBeenCalledWith({
      err: error,
      message: 'Failed to fetch overseas reprocessing sites for admin view'
    })

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [],
      pagination: {},
      page: 1,
      totalPages: 0,
      error:
        'There was a problem loading overseas reprocessing site data. Please try again.'
    })
  })
})
