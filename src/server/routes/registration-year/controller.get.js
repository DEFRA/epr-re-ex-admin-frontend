import { yearKind } from '#server/common/constants/registration.js'
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
import { yearDetails } from '#server/common/helpers/registration-years.js'

/**
 * @import { AccreditationKeys } from '#server/common/helpers/natural-keys/swap-keys.js'
 * @import { YearKind } from '#server/common/constants/registration.js'
 */

/** @type {Record<YearKind, { label: string, notFound: { message: string, code: string, action: string } }>} */
const YEAR_KINDS = {
  [yearKind.accredited]: {
    label: 'accredited',
    notFound: {
      message: 'Accreditation not found',
      code: errorCodes.accreditationNotFound,
      action: 'fetch_accreditation'
    }
  },
  [yearKind.registeredOnly]: {
    label: 'registered only',
    notFound: {
      message: 'Registered-only year not found',
      code: errorCodes.registeredOnlyYearNotFound,
      action: 'fetch_registered_only_year'
    }
  }
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
    const details = yearDetails(registration, year)

    if (details?.kind !== kind) {
      const { message, code, action } = YEAR_KINDS[kind].notFound
      throw notFound(message, code, {
        event: {
          action,
          reason: `organisationNumber=${organisationNumber} registrationNumber=${registrationNumber} year=${year}`
        }
      })
    }

    const accreditationKeys = details.kind === yearKind.accredited ? keys : null

    const [summaryLogRows, reportingPeriods, wasteBalance] = await Promise.all([
      fetchSummaryLogRows(request, registrationKeys, year),
      fetchPeriods(request, registrationKeys, Number(year)),
      accreditationKeys && fetchWasteBalance(request, accreditationKeys)
    ])

    const { wasteRecordsDownloadUrl, ...links } = toRegistrationLinks(
      registration,
      registrationKeys,
      accreditationKeys
    )

    return h.view('routes/registration-year/index', {
      breadcrumbs: registrationBreadcrumbs(keys),
      pageTitle: request.route.settings.app.pageTitle,
      heading: `${organisation.name} - ${registrationNumber} - ${year} ${YEAR_KINDS[kind].label}`,
      registration: {
        processingType: processingTypeOf(registration),
        material: registration.material,
        site: siteOf(registration),
        accreditation: details.accreditation
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

export const accreditedYearGETController = registrationYearGETController(
  yearKind.accredited
)

export const registeredOnlyYearGETController = registrationYearGETController(
  yearKind.registeredOnly
)

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
    const details = yearDetails(registration, year)

    if (!details) {
      throw notFound('Year not found', errorCodes.registrationYearNotFound, {
        event: {
          action: 'fetch_registration_year',
          reason: `organisationNumber=${organisationNumber} registrationNumber=${registrationNumber} year=${year}`
        }
      })
    }

    return h.redirect(yearPageUrls[details.kind](keys))
  }
}
