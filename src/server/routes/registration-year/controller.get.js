import { errorCodes } from '#server/common/enums/error-codes.js'
import {
  fetchOrganisationView,
  processingTypeOf,
  registrationIn,
  siteOf
} from '#server/common/helpers/fetch-organisation-view.js'
import { notFound } from '#server/common/helpers/logging/cdp-boom.js'
import {
  registrationBreadcrumbs,
  yearPageUrls
} from '#server/common/helpers/page-urls.js'
import {
  fetchPeriods,
  fetchSummaryLogRows,
  fetchWasteBalance,
  toRegistrationLinks,
  toReportRows
} from '#server/common/helpers/registration-sections.js'
import {
  accreditationFor,
  utcToday,
  yearKind
} from '#server/common/helpers/registration-years.js'

/**
 * @import { OrganisationView, RegistrationView } from '#server/common/helpers/fetch-organisation-view.js'
 * @import { AccreditationKeys } from '#server/common/helpers/natural-keys/swap-keys.js'
 * @import { YearKind } from '#server/common/helpers/registration-years.js'
 */

/** @type {Record<YearKind, { label: string, notFound: [string, string, string] }>} */
const YEAR_KINDS = {
  accredited: {
    label: 'accredited',
    notFound: [
      'Accreditation not found',
      errorCodes.accreditationNotFound,
      'fetch_accreditation'
    ]
  },
  'registered-only': {
    label: 'registered only',
    notFound: [
      'Registered-only year not found',
      errorCodes.registeredOnlyYearNotFound,
      'fetch_registered_only_year'
    ]
  }
}

/** @type {[string, string, string]} */
const YEAR_NOT_FOUND = [
  'Year not found',
  errorCodes.registrationYearNotFound,
  'fetch_registration_year'
]

/**
 * The year's kind, or a 404 when the year is neither kind, or is not
 * `expected`.
 * @param {OrganisationView} organisation
 * @param {RegistrationView} registration
 * @param {AccreditationKeys} keys
 * @param {YearKind} [expected]
 * @returns {YearKind}
 */
const yearKindOrNotFound = (organisation, registration, keys, expected) => {
  const kind = yearKind(registration, keys.year, utcToday())
  if (!kind || (expected && kind !== expected)) {
    const [message, code, action] = expected
      ? YEAR_KINDS[expected].notFound
      : YEAR_NOT_FOUND
    throw notFound(message, code, {
      event: {
        action,
        reason: `organisationNumber=${organisation.organisationNumber} registrationNumber=${keys.registrationNumber} year=${keys.year}`
      }
    })
  }
  return kind
}

/**
 * A registration's page for one year of `kind`.
 * @param {YearKind} kind
 */
const registrationYearGETController = (kind) => ({
  async handler(request, h) {
    const { organisationNumber, registrationNumber, year } = request.params
    /** @type {AccreditationKeys} */
    const keys = { organisationNumber, registrationNumber, year }
    const registrationKeys = { organisationNumber, registrationNumber }

    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const organisation = await fetchOrganisationView(
      request,
      organisationNumber
    )
    const registration = registrationIn(organisation, registrationNumber)
    yearKindOrNotFound(organisation, registration, keys, kind)
    const accreditation = accreditationFor(registration, year)

    const [summaryLogRows, reportingPeriods, wasteBalance] = await Promise.all([
      fetchSummaryLogRows(request, registrationKeys, year),
      fetchPeriods(request, registrationKeys, Number(year)),
      accreditation ? fetchWasteBalance(request, keys) : null
    ])

    const { wasteRecordsDownloadUrl, ...links } = toRegistrationLinks(
      registration,
      registrationKeys,
      accreditation && keys
    )

    return h.view('routes/registration-year/index', {
      breadcrumbs: registrationBreadcrumbs(keys),
      pageTitle: request.route.settings.app.pageTitle,
      heading: `${organisation.name} - ${registrationNumber} - ${year} ${YEAR_KINDS[kind].label}`,
      registration: {
        processingType: processingTypeOf(registration),
        material: registration.material,
        site: siteOf(registration),
        accreditation
      },
      ...links,
      reportRows: toReportRows(
        registrationKeys,
        reportingPeriods,
        request.auth.credentials.scopes
      ),
      summaryLogRows,
      wasteBalance,
      error: errorMessage
    })
  }
})

export const accreditedYearGETController =
  registrationYearGETController('accredited')

export const registeredOnlyYearGETController =
  registrationYearGETController('registered-only')

/**
 * Sends a year to its accredited page when the registration held an
 * accreditation in it, otherwise to its registered-only page.
 */
export const registrationYearRedirectController = {
  async handler(request, h) {
    const { organisationNumber, registrationNumber, year } = request.params
    const keys = { organisationNumber, registrationNumber, year }

    const organisation = await fetchOrganisationView(
      request,
      organisationNumber
    )
    const registration = registrationIn(organisation, registrationNumber)

    return h.redirect(
      yearPageUrls[yearKindOrNotFound(organisation, registration, keys)](keys)
    )
  }
}
