import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { registrationOverviewGETController } from './controller.get.js'
import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-organisation-overview.js', () => ({
  fetchOrganisationOverview: vi.fn()
}))

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockRegistration = {
  id: '69c3b4f0abda9efa68dd669b',
  registrationNumber: 'REG-50030-001',
  status: 'approved',
  material: 'glass',
  site: 'Site A',
  processingType: 'reprocessing',
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

const mockOverview = {
  id: '69c3b4f0abda9efa68dd6697',
  companyName: 'ACME ltd',
  registrations: [mockRegistration]
}

const mockCalendar = {
  cadence: 'monthly',
  reportingPeriods: mockRegistration.reports.reportingPeriods
}

describe('registration-overview GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: {
        organisationId: '69c3b4f0abda9efa68dd6697',
        registrationId: '69c3b4f0abda9efa68dd669b'
      },
      route: {
        settings: {
          app: { pageTitle: 'Reports' }
        }
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('fetches the organisation overview from the backend', async () => {
    fetchOrganisationOverview.mockResolvedValue(mockOverview)
    fetchJsonFromBackend.mockResolvedValue(mockCalendar)

    await registrationOverviewGETController.handler(mockRequest, mockH)

    expect(fetchOrganisationOverview).toHaveBeenCalledWith(
      mockRequest,
      '69c3b4f0abda9efa68dd6697'
    )
  })

  test('fetches the reporting periods from the calendar endpoint', async () => {
    fetchOrganisationOverview.mockResolvedValue(mockOverview)
    fetchJsonFromBackend.mockResolvedValue(mockCalendar)

    await registrationOverviewGETController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/69c3b4f0abda9efa68dd6697/registrations/69c3b4f0abda9efa68dd669b/reports/calendar',
      {}
    )
  })

  test('throws a 404 when the registration is not found in the overview', async () => {
    fetchOrganisationOverview.mockResolvedValue({
      ...mockOverview,
      registrations: []
    })

    await expect(
      registrationOverviewGETController.handler(mockRequest, mockH)
    ).rejects.toMatchObject(Boom.notFound())
  })

  test('renders the view with registration, cadence and reporting periods', async () => {
    fetchOrganisationOverview.mockResolvedValue(mockOverview)
    fetchJsonFromBackend.mockResolvedValue(mockCalendar)

    await registrationOverviewGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/registration-overview/index',
      {
        breadcrumbs: [
          { text: 'Organisations', href: '/organisations' },
          {
            text: 'Overview',
            href: '/organisations/69c3b4f0abda9efa68dd6697/overview'
          }
        ],
        pageTitle: 'Reports',
        heading: 'ACME ltd - REG-50030-001',
        organisationId: '69c3b4f0abda9efa68dd6697',
        registrationId: '69c3b4f0abda9efa68dd669b',
        registration: mockRegistration,
        cadence: 'monthly',
        reportingPeriods: mockCalendar.reportingPeriods
      }
    )
  })

  test('passes breadcrumbs for organisations and overview', async () => {
    fetchOrganisationOverview.mockResolvedValue(mockOverview)
    fetchJsonFromBackend.mockResolvedValue(mockCalendar)

    await registrationOverviewGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/registration-overview/index',
      expect.objectContaining({
        breadcrumbs: [
          { text: 'Organisations', href: '/organisations' },
          {
            text: 'Overview',
            href: '/organisations/69c3b4f0abda9efa68dd6697/overview'
          }
        ]
      })
    )
  })

  test('passes site and processingType from registration to the view', async () => {
    fetchOrganisationOverview.mockResolvedValue(mockOverview)
    fetchJsonFromBackend.mockResolvedValue(mockCalendar)

    await registrationOverviewGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/registration-overview/index',
      expect.objectContaining({
        registration: expect.objectContaining({
          site: 'Site A',
          processingType: 'reprocessing'
        })
      })
    )
  })

  test('uses registrationNumber as heading', async () => {
    fetchOrganisationOverview.mockResolvedValue(mockOverview)
    fetchJsonFromBackend.mockResolvedValue(mockCalendar)

    await registrationOverviewGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/registration-overview/index',
      expect.objectContaining({ heading: 'ACME ltd - REG-50030-001' })
    )
  })

  test('falls back to registration.id as heading when registrationNumber is missing', async () => {
    const registrationWithoutNumber = {
      ...mockRegistration,
      registrationNumber: undefined
    }
    fetchOrganisationOverview.mockResolvedValue({
      ...mockOverview,
      registrations: [registrationWithoutNumber]
    })
    fetchJsonFromBackend.mockResolvedValue(mockCalendar)

    await registrationOverviewGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/registration-overview/index',
      expect.objectContaining({
        heading: 'ACME ltd - 69c3b4f0abda9efa68dd669b'
      })
    )
  })
})
