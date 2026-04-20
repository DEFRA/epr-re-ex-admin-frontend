import { vi } from 'vitest'
import { organisationOverviewGETController } from './controller.get.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockOrganisationOverview = {
  id: '69c3b4f0abda9efa68dd6697',
  companyName: 'ACME ltd',
  registrations: [
    {
      id: '69c3b4f0abda9efa68dd669b',
      registrationNumber: 'REG-50030-001',
      status: 'approved',
      material: 'glass',
      accreditation: {
        id: '69c3b4f0abda9efa68dd6698',
        accreditationNumber: 'ACC-50030-001',
        status: 'approved'
      },
      reports: {
        cadence: 'monthly',
        reportingPeriods: [
          {
            year: 2026,
            period: 1,
            startDate: '2026-01-01',
            endDate: '2026-01-31',
            dueDate: '2026-02-20',
            report: {
              id: 'b41148de-8a76-4214-b68d-4b786400fb90',
              status: 'ready_to_submit',
              submissionNumber: 1
            }
          },
          {
            year: 2026,
            period: 2,
            startDate: '2026-02-01',
            endDate: '2026-02-28',
            dueDate: '2026-03-20',
            report: null
          }
        ]
      }
    }
  ]
}

describe('organisation-overview GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: { id: '69c3b4f0abda9efa68dd6697' },
      route: {
        settings: {
          app: { pageTitle: 'Organisation Overview' }
        }
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('fetches organisation overview from backend using the id param', async () => {
    fetchJsonFromBackend.mockResolvedValue(mockOrganisationOverview)

    await organisationOverviewGETController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/69c3b4f0abda9efa68dd6697/overview',
      {}
    )
  })

  test('renders the view with correct context', async () => {
    fetchJsonFromBackend.mockResolvedValue(mockOrganisationOverview)

    await organisationOverviewGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation-overview/index',
      {
        pageTitle: 'Organisation Overview',
        heading: 'ACME ltd',
        organisationId: '69c3b4f0abda9efa68dd6697',
        registrations: mockOrganisationOverview.registrations
      }
    )
  })

  test('uses companyName from response as heading', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      ...mockOrganisationOverview,
      companyName: 'Different Company'
    })

    await organisationOverviewGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation-overview/index',
      expect.objectContaining({ heading: 'Different Company' })
    )
  })
})
