import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { createServer } from '#server/server.js'
import { http, HttpResponse, server as mswServer } from '#vite/setup-msw.js'
import {
  getAllByRole,
  getByRole,
  getByText,
  queryByRole
} from '@testing-library/dom'
import { Window } from 'happy-dom'
import { vi } from 'vitest'

/** @import { OverseasSites } from './controller.get.js' */

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('#accreditationOverseasSitesController', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const organisationId = '69c3b4f0abda9efa68dd6697'
  const registrationId = 'reg-001'
  const accreditationId = '69c3b4f0abda9efa68dd6698'
  const url = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/overseas-sites`
  let server

  beforeAll(async () => {
    config.set('eprBackendUrl', backendUrl)
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    config.set('eprBackendUrl', originalBackendUrl)
    await server.stop({ timeout: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockOverview = {
    id: organisationId,
    companyName: 'ACME ltd',
    registrations: [
      {
        id: 'reg-001',
        registrationNumber: 'REG-50030-001',
        status: 'approved',
        processingType: 'reprocessing',
        material: 'glass',
        site: 'Site A',
        accreditation: {
          id: accreditationId,
          accreditationNumber: 'ACC-50030-001',
          status: 'approved'
        }
      }
    ]
  }

  const mockOverviewNoMatchingRegistration = {
    id: organisationId,
    companyName: 'ACME ltd',
    registrations: []
  }

  /** @type {OverseasSites} */
  const mockSites = {
    '001': {
      name: 'Beta Reprocessor',
      country: 'Germany',
      address: {
        line1: '2 Teststrasse',
        line2: 'Zone 2',
        townOrCity: 'Berlin',
        stateOrRegion: 'Berlin-Mitte',
        postcode: '10115'
      },
      coordinates: '52.5200,13.4050',
      validFrom: '2024-01-01T00:00:00.000Z'
    },
    '002': {
      name: 'Gamma Recycling',
      country: 'France',
      address: {
        line1: '5 Rue de Test',
        townOrCity: 'Lyon'
      },
      coordinates: null,
      validFrom: '2024-06-15T00:00:00.000Z'
    }
  }

  const renderPage = (html) => {
    const window = new Window()
    window.document.body.innerHTML = html
    return /** @type {HTMLElement} */ (
      /** @type {unknown} */ (window.document.body)
    )
  }

  const getSitesTable = (container) =>
    getByRole(container, 'table', { name: 'Overseas sites' })

  const getDataRows = (table) => getAllByRole(table, 'row').slice(1)

  /**
   * @param {typeof mockOverview} [overviewResponse]
   * @param {OverseasSites} [sitesResponse]
   */
  const useMockBackend = (
    overviewResponse = mockOverview,
    sitesResponse = mockSites
  ) => {
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json(overviewResponse)
      ),
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/overseas-sites`,
        () => HttpResponse.json(sitesResponse)
      )
    )
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code', async () => {
      const { statusCode } = await server.inject({ method: 'GET', url })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })
  })

  describe('When user is authenticated', () => {
    beforeAll(() => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    })

    test('Should return OK', async () => {
      useMockBackend()

      const { statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should render the heading with company name and accreditation number', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(getByRole(body, 'heading', { level: 1 })).toHaveTextContent(
        'ACME ltd - ACC-50030-001'
      )
    })

    test('Should return 404 when registration is not found', async () => {
      useMockBackend(mockOverviewNoMatchingRegistration)

      const { statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })

    test('Should render breadcrumbs back to registration overview', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const breadcrumbs = getByRole(body, 'navigation', {
        name: 'Breadcrumb'
      })

      expect(
        getAllByRole(breadcrumbs, 'link').map((l) => ({
          text: l.textContent?.trim(),
          href: l.getAttribute('href')
        }))
      ).toEqual([
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        {
          text: 'Registration overview',
          href: `/organisations/${organisationId}/registrations/reg-001/overview`
        }
      ])
    })

    test('Should render the site columns without the constant identifier columns', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        getAllByRole(getSitesTable(body), 'columnheader').map((h) =>
          h.textContent?.trim()
        )
      ).toEqual([
        'ORS ID',
        'Packaging waste category',
        'Destination country',
        'Overseas reprocessor name',
        'Address line 1',
        'Address line 2',
        'City or town',
        'State, province or region',
        'Postcode or similar',
        'Coordinates',
        'Valid from'
      ])
    })

    test('Should render a site row keyed by its ORS id with site detail', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const rows = getDataRows(getSitesTable(body))

      expect(rows).toHaveLength(2)

      const cells = getAllByRole(rows[0], 'cell').map((cell) =>
        cell.textContent?.trim()
      )
      expect(cells).toEqual([
        '001',
        'glass',
        'Germany',
        'Beta Reprocessor',
        '2 Teststrasse',
        'Zone 2',
        'Berlin',
        'Berlin-Mitte',
        '10115',
        '52.5200,13.4050',
        '1 January 2024'
      ])
    })

    test('Should show the valid-from date for an approved site', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const cells = getAllByRole(getDataRows(getSitesTable(body))[0], 'cell')

      expect(cells[10]).toHaveTextContent('1 January 2024')
    })

    test('Should show a dash valid-from for an unapproved site', async () => {
      useMockBackend(mockOverview, {
        '004': {
          name: 'Delta Processing',
          country: 'Spain',
          address: { line1: '9 Calle Test', townOrCity: 'Madrid' },
          coordinates: null,
          validFrom: null
        }
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const cells = getAllByRole(getDataRows(getSitesTable(body))[0], 'cell')

      expect(cells[3]).toHaveTextContent('Delta Processing')
      expect(cells[10]).toHaveTextContent('-')
    })

    test('Should distinguish approved from unapproved sites by their valid-from date', async () => {
      useMockBackend(mockOverview, {
        '001': {
          name: 'Beta Reprocessor',
          country: 'Germany',
          address: { line1: '2 Teststrasse', townOrCity: 'Berlin' },
          coordinates: null,
          validFrom: '2024-01-01T00:00:00.000Z'
        },
        '004': {
          name: 'Delta Processing',
          country: 'Spain',
          address: { line1: '9 Calle Test', townOrCity: 'Madrid' },
          coordinates: null,
          validFrom: null
        }
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const rows = getDataRows(getSitesTable(body))

      expect(getAllByRole(rows[0], 'cell')[10]).toHaveTextContent(
        '1 January 2024'
      )
      expect(getAllByRole(rows[1], 'cell')[10]).toHaveTextContent('-')
    })

    test('Should render a dash for absent address lines', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const cells = getAllByRole(getDataRows(getSitesTable(body))[1], 'cell')

      expect(cells[4]).toHaveTextContent('5 Rue de Test')
      expect(cells[5]).toHaveTextContent('-')
      expect(cells[6]).toHaveTextContent('Lyon')
      expect(cells[7]).toHaveTextContent('-')
      expect(cells[8]).toHaveTextContent('-')
      expect(cells[9]).toHaveTextContent('-')
    })

    test('Should render an unresolved site with its id, dashes for unknown detail and dash valid-from', async () => {
      useMockBackend(mockOverview, {
        '003': {
          name: null,
          country: null,
          address: null,
          coordinates: null,
          validFrom: null
        }
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const cells = getAllByRole(getDataRows(getSitesTable(body))[0], 'cell')

      expect(cells[0]).toHaveTextContent('003')
      expect(cells[2]).toHaveTextContent('-')
      expect(cells[3]).toHaveTextContent('-')
      expect(cells[4]).toHaveTextContent('-')
      expect(cells[9]).toHaveTextContent('-')
      expect(cells[10]).toHaveTextContent('-')
    })

    test('Should render empty-state when there are no overseas sites', async () => {
      useMockBackend(mockOverview, {})

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(queryByRole(body, 'table', { name: 'Overseas sites' })).toBeNull()
      expect(getByText(body, 'No overseas sites')).toBeInTheDocument()
    })

    test('Should show 500 error page when backend returns a non-OK response', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => {
            throw HttpResponse.text('', { status: 500 })
          }
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        getByText(body, 'Sorry, there is a problem with the service')
      ).toBeInTheDocument()
    })
  })
})
