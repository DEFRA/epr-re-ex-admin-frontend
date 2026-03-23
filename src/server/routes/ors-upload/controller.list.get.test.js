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
    fetchJsonFromBackend.mockResolvedValue([
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
    ])

    await orsListGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/overseas-sites'
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
      error: null
    })
  })

  test('returns empty rows when backend returns no values', async () => {
    fetchJsonFromBackend.mockResolvedValue(undefined)

    await orsListGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/list', {
      pageTitle: 'Overseas reprocessing sites',
      rows: [],
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
      error:
        'There was a problem loading overseas reprocessing site data. Please try again.'
    })
  })
})
