import { vi } from 'vitest'
import { reportDetailGETController } from './controller.get.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockReport = {
  id: 'b41148de-8a76-4214-b68d-4b786400fb90',
  status: 'ready_to_submit',
  submissionNumber: 1
}

describe('reports GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: {
        organisationId: '69c3b4f0abda9efa68dd6697',
        registrationId: '69c3b4f0abda9efa68dd669b',
        year: '2026',
        cadence: 'monthly',
        period: '1'
      },
      route: {
        settings: {
          app: { pageTitle: 'Report' }
        }
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('fetches report from backend using all route params', async () => {
    fetchJsonFromBackend.mockResolvedValue(mockReport)

    await reportDetailGETController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/69c3b4f0abda9efa68dd6697/registrations/69c3b4f0abda9efa68dd669b/reports/2026/monthly/1',
      {}
    )
  })

  test('renders the view with correct context', async () => {
    fetchJsonFromBackend.mockResolvedValue(mockReport)

    await reportDetailGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/reports/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Overview',
          href: '/organisations/69c3b4f0abda9efa68dd6697/overview'
        },
        {
          text: 'Registration reports',
          href: '/organisations/69c3b4f0abda9efa68dd6697/registrations/69c3b4f0abda9efa68dd669b/reports'
        }
      ],
      pageTitle: 'Report',
      heading: 'Report',
      reportJson: JSON.stringify(mockReport, null, 2)
    })
  })

  test('passes breadcrumbs for organisations, overview and registration reports', async () => {
    fetchJsonFromBackend.mockResolvedValue(mockReport)

    await reportDetailGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/reports/index',
      expect.objectContaining({
        breadcrumbs: [
          { text: 'Organisations', href: '/organisations' },
          {
            text: 'Overview',
            href: '/organisations/69c3b4f0abda9efa68dd6697/overview'
          },
          {
            text: 'Registration reports',
            href: '/organisations/69c3b4f0abda9efa68dd6697/registrations/69c3b4f0abda9efa68dd669b/reports'
          }
        ]
      })
    )
  })

  test('uses pageTitle as heading', async () => {
    mockRequest.route.settings.app.pageTitle = 'Custom Title'
    fetchJsonFromBackend.mockResolvedValue(mockReport)

    await reportDetailGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/reports/index',
      expect.objectContaining({
        heading: 'Custom Title',
        pageTitle: 'Custom Title'
      })
    )
  })
})
