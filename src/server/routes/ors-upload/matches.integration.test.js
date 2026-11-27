import * as cheerio from 'cheerio'
import { vi } from 'vitest'

import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { createServer } from '#server/server.js'
import { HttpResponse, http, server as mswServer } from '#vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

vi.mock('#server/common/helpers/fetch-waste-record-years.js', () => ({
  fetchWasteRecordYears: vi.fn().mockResolvedValue(['2027', '2026'])
}))

const registration = {
  orgId: 500049,
  registrationNumber: 'R26ER5000490001ST',
  packagingWasteCategory: 'steel'
}

/**
 * @import { OverseasSiteRow } from './overseas-sites-csv.js'
 * @import { RegistrationServiceSiteRow } from './controller.registration-service-download.js'
 */

/**
 * @param {string} orsId
 * @param {string} name
 * @param {string} line1
 * @returns {OverseasSiteRow}
 */
const reExSite = (orsId, name, line1) => ({
  ...registration,
  accreditationNumber: 'A26ER5000490001ST',
  orsId,
  destinationCountry: 'India',
  overseasReprocessorName: name,
  addressLine1: line1,
  addressLine2: null,
  cityOrTown: 'Kolkata',
  stateProvinceOrRegion: null,
  postcode: '700001',
  coordinates: null,
  validFrom: '2026-01-01T00:00:00.000Z'
})

/**
 * @param {string | null} orsId
 * @param {string} name
 * @param {string} line1
 * @param {Partial<RegistrationServiceSiteRow>} [application]
 * @returns {RegistrationServiceSiteRow}
 */
const registrationServiceSite = (orsId, name, line1, application = {}) => ({
  ...registration,
  year: 2027,
  applicationReference: 'APP-1',
  applicationStatus: 'Approved',
  accreditationNumber: null,
  siteId: 1,
  orsId,
  selected: true,
  overseasReprocessorName: name,
  formattedAddress: null,
  destinationCountry: 'India',
  addressLine1: line1,
  addressLine2: null,
  cityOrTown: 'Kolkata',
  coordinates: null,
  ...application
})

describe('overseas sites matches integration', () => {
  const backendUrl = config.get('eprBackendUrl')
  const pagePath = '/overseas-sites/matches'
  let server

  beforeAll(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * @param {{
   *   reEx?: OverseasSiteRow[] | number,
   *   registrationService?: RegistrationServiceSiteRow[] | number
   * }} answers - a number answers that request with that status
   */
  const stubBackend = ({ reEx = [], registrationService = [] }) => {
    /** @type {string[]} */
    const reExQueries = []
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/overseas-sites`, ({ request }) => {
        reExQueries.push(new URL(request.url).search)
        return Array.isArray(reEx)
          ? HttpResponse.json({ rows: reEx, pagination: {} })
          : new HttpResponse(null, { status: reEx })
      }),
      http.get(
        `${backendUrl}/v1/admin/registration-service/overseas-sites`,
        () =>
          Array.isArray(registrationService)
            ? HttpResponse.json({ rows: registrationService })
            : new HttpResponse(null, { status: registrationService })
      )
    )
    return reExQueries
  }

  const getPage = async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: `${pagePath}?year=2026`,
      auth: { strategy: 'session', credentials: mockUserSession }
    })
    return { $: cheerio.load(result), statusCode }
  }

  /**
   * @param {cheerio.CheerioAPI} $
   * @param {string} testId
   */
  const tableRows = ($, testId) =>
    $(`[data-testid="${testId}"] tbody tr`)
      .toArray()
      .map((row) =>
        $(row)
          .find('td')
          .toArray()
          .map((cell) => $(cell).text().trim())
      )

  test('Should return unauthorised when the user is not signed in', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null)

    const { statusCode } = await server.inject({ method: 'GET', url: pagePath })

    expect(statusCode).toBe(statusCodes.unauthorised)
  })

  test('Should show every group of matched and unmatched sites', async () => {
    const reExQueries = stubBackend({
      reEx: [
        reExSite('001', 'Bengal Steelworks', '12 Mill Road'),
        reExSite('002', 'Ganges Metals', '3 River Street'),
        reExSite('003', 'Indus Recycling', '4 Port Lane'),
        reExSite('004', 'Andes Paper', '1 Calle Uno'),
        reExSite('005', 'Kaveri Plastics', '8 Canal Road'),
        reExSite('006', 'Mekong Glass', '6 Bay Road')
      ],
      registrationService: [
        registrationServiceSite('001', 'Bengal Steelworks', '12 Mill Road'),
        registrationServiceSite('007', 'Ganges Metals', '3 River Street'),
        registrationServiceSite('002', 'Volga Fibres', '5 Quay Road'),
        registrationServiceSite('008', 'Mekong Glass', '6 Bay Road'),
        registrationServiceSite('003', 'Delta Steel', '9 Dock Road', {
          applicationStatus: 'Started',
          selected: false
        }),
        registrationServiceSite(null, 'Andes Paper', '1 Calle Uno', {
          applicationStatus: 'Submitted'
        })
      ]
    })

    const { $, statusCode } = await getPage()

    expect(statusCode).toBe(statusCodes.ok)
    expect(reExQueries).toEqual(['?year=2026&all=true'])
    expect($('h1').text()).toBe(
      'Overseas reprocessing sites matched with the registration service'
    )
    expect(tableRows($, 'same-number')).toEqual([
      [
        '500049',
        'R26ER5000490001ST',
        '001',
        'Bengal Steelworks',
        'India',
        '12 Mill Road',
        '2027 Approved'
      ]
    ])
    expect(tableRows($, 'different-number')).toEqual([
      [
        '500049',
        'R26ER5000490001ST',
        '002',
        '007',
        'Ganges Metals',
        'India',
        '3 River Street',
        '2027 Approved',
        'Clash: Volga Fibres, 5 Quay Road (keeps it)'
      ],
      [
        '500049',
        'R26ER5000490001ST',
        '006',
        '008',
        'Mekong Glass',
        'India',
        '6 Bay Road',
        '2027 Approved',
        '-'
      ]
    ])
    expect(tableRows($, 're-ex-only')).toEqual([
      [
        '500049',
        'R26ER5000490001ST',
        '003',
        'Indus Recycling',
        'India',
        '4 Port Lane',
        'Check: ORS ID 003, Delta Steel, 9 Dock Road (same ORS ID)'
      ],
      [
        '500049',
        'R26ER5000490001ST',
        '004',
        'Andes Paper',
        'India',
        '1 Calle Uno',
        'Check: ORS ID None, Andes Paper, 1 Calle Uno (same details)'
      ],
      [
        '500049',
        'R26ER5000490001ST',
        '005',
        'Kaveri Plastics',
        'India',
        '8 Canal Road',
        '-'
      ]
    ])
    expect(tableRows($, 'registration-service-only')).toEqual([
      [
        '500049',
        'R26ER5000490001ST',
        '002',
        'Volga Fibres',
        'India',
        '5 Quay Road',
        '2027 Approved',
        'Check: ORS ID 002, Ganges Metals, 3 River Street (same ORS ID)',
        'Clash: Ganges Metals, 3 River Street'
      ],
      [
        '500049',
        'R26ER5000490001ST',
        '003',
        'Delta Steel',
        'India',
        '9 Dock Road',
        '2027 Started (deselected)',
        'Check: ORS ID 003, Indus Recycling, 4 Port Lane (same ORS ID)',
        '-'
      ],
      [
        '500049',
        'R26ER5000490001ST',
        'Check: None',
        'Andes Paper',
        'India',
        '1 Calle Uno',
        '2027 Submitted',
        'Check: ORS ID 004, Andes Paper, 1 Calle Uno (same details)',
        '-'
      ]
    ])
  })

  test('Should say which renumbered sites must move in order, as a chain or a swap, and which are blocked', async () => {
    stubBackend({
      reEx: [
        reExSite('001', 'Bengal Steelworks', '12 Mill Road'),
        reExSite('002', 'Ganges Metals', '3 River Street'),
        reExSite('003', 'Indus Recycling', '4 Port Lane'),
        reExSite('004', 'Andes Paper', '1 Calle Uno'),
        reExSite('007', 'Rhine Metals', '8 Canal Street'),
        reExSite('009', 'Volga Fibres', '5 Quay Road')
      ],
      registrationService: [
        registrationServiceSite('005', 'Bengal Steelworks', '12 Mill Road'),
        registrationServiceSite('001', 'Ganges Metals', '3 River Street'),
        registrationServiceSite('004', 'Indus Recycling', '4 Port Lane'),
        registrationServiceSite('003', 'Andes Paper', '1 Calle Uno'),
        registrationServiceSite('010', 'Rhine Metals', '8 Canal Street'),
        registrationServiceSite('007', 'Volga Fibres', '5 Quay Road'),
        registrationServiceSite('009', 'Danube Glass', '2 Dock Lane')
      ]
    })

    const { $ } = await getPage()

    expect(tableRows($, 'different-number').map((row) => row.at(-1))).toEqual([
      'Chain: Ganges Metals, 3 River Street (moves to 002)',
      '-',
      'Swap: Andes Paper, 1 Calle Uno (moves to 004)',
      'Swap: Indus Recycling, 4 Port Lane (moves to 003)',
      'Blocked: Danube Glass, 2 Dock Lane keeps 009',
      'Clash: Danube Glass, 2 Dock Lane (keeps it)'
    ])
  })

  test('Should send a visit that names no report year to the default year', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: pagePath,
      auth: { strategy: 'session', credentials: mockUserSession }
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toMatch(/^\/overseas-sites\/matches\?year=\d{4}$/)
  })

  test('Should say so when a group is empty', async () => {
    stubBackend({ reEx: [], registrationService: [] })

    const { $ } = await getPage()

    expect($('table')).toHaveLength(0)
    expect(
      $('.govuk-inset-text')
        .toArray()
        .map((inset) => $(inset).text().trim())
    ).toEqual([
      'No sites match with the same ORS ID.',
      'No sites match with a different ORS ID.',
      'Every re-ex site matches a registration service site.',
      'Every registration service site matches a re-ex site.'
    ])
  })

  test.each([
    [
      statusCodes.badGateway,
      'The registration service did not respond. Please try again later.'
    ],
    [
      statusCodes.serviceUnavailable,
      'The registration service is not available. Please try again later.'
    ],
    [
      statusCodes.internalServerError,
      'There was a problem matching the overseas reprocessing sites. Please try again.'
    ]
  ])(
    'Should explain a %i from the backend and show no groups',
    async (status, message) => {
      stubBackend({ registrationService: status })

      const { $, statusCode } = await getPage()

      expect(statusCode).toBe(statusCodes.ok)
      expect($('.govuk-error-summary').text()).toContain(message)
      expect($('table, .govuk-inset-text')).toHaveLength(0)
    }
  )

  test('Should not blame the registration service when re-ex cannot be read', async () => {
    stubBackend({ reEx: statusCodes.serviceUnavailable })

    const { $ } = await getPage()

    expect($('.govuk-error-summary').text()).toContain(
      'There was a problem matching the overseas reprocessing sites. Please try again.'
    )
    expect($('table, .govuk-inset-text')).toHaveLength(0)
  })

  test('Should explain a backend answer it cannot read and show no groups', async () => {
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/overseas-sites`, () =>
        HttpResponse.json({})
      ),
      http.get(
        `${backendUrl}/v1/admin/registration-service/overseas-sites`,
        () => HttpResponse.json({})
      )
    )

    const { $ } = await getPage()

    expect($('.govuk-error-summary').text()).toContain(
      'There was a problem matching the overseas reprocessing sites. Please try again.'
    )
    expect($('table, .govuk-inset-text')).toHaveLength(0)
  })
})
