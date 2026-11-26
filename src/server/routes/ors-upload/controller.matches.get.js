import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import { toDisplayValue } from '#server/common/helpers/overseas-site-display.js'
import {
  defaultReportYear,
  reportUrlForYear,
  reportYears
} from '#server/common/helpers/report-year.js'
import { orsUploadRoutes } from './constants.js'
import {
  registrationServiceErrorMessages,
  registrationServiceSitesPath
} from './controller.registration-service-download.js'
import { buildBackendPath } from './helpers.js'
import { matchOverseasSites } from './overseas-site-matching.js'

/**
 * @import { Boom } from '@hapi/boom'
 * @import { ResponseToolkit } from '@hapi/hapi'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { OverseasSiteRow } from './overseas-sites-csv.js'
 * @import { RegistrationServiceSiteRow } from './controller.registration-service-download.js'
 * @import { NearMatch, NearMatchReason, OverseasSiteMatches, RegistrationServiceSite } from './overseas-site-matching.js'
 */

const logger = createLogger()

const defaultErrorMessage =
  'There was a problem matching the overseas reprocessing sites. Please try again.'

/** A failure reading the registration service's sites, told to the admin as its message. */
class RegistrationServiceError extends Error {}

/**
 * @param {HapiRequest} request
 * @returns {Promise<{ rows: RegistrationServiceSiteRow[] }>}
 */
const fetchRegistrationServiceSites = (request) =>
  fetchJsonFromBackend(request, registrationServiceSitesPath).catch(
    /** @param {Boom} cause - fetchJsonFromBackend fails only with a Boom */
    (cause) => {
      throw new RegistrationServiceError(
        registrationServiceErrorMessages[cause.output.statusCode] ??
          defaultErrorMessage,
        { cause }
      )
    }
  )

/** @type {Record<NearMatchReason, string>} */
const nearMatchReasons = {
  sameDetails: 'same details',
  sameNumber: 'same ORS ID',
  sameName: 'same name',
  sameAddressLine1: 'same address line 1'
}

/** @param {string | null | undefined} orsId */
const orsIdText = (orsId) => orsId ?? 'None'

/** @param {NearMatch[]} nearMatches */
const nearMatchesText = (nearMatches) =>
  nearMatches.length
    ? nearMatches
        .map(
          ({ reason, orsId, overseasReprocessorName, addressLine1 }) =>
            `Check: ORS ID ${orsIdText(orsId)}, ${toDisplayValue(overseasReprocessorName)}, ${toDisplayValue(addressLine1)} (${nearMatchReasons[reason]})`
        )
        .join('; ')
    : '-'

/** @param {(string | number | null | undefined)[]} values */
const cells = (values) =>
  values.map((value) => ({ text: toDisplayValue(value?.toString()) }))

/** @param {OverseasSiteRow} site */
const registrationCells = (site) => cells([site.orgId, site.registrationNumber])

/** @param {OverseasSiteRow} site */
const siteCells = (site) =>
  cells([
    site.overseasReprocessorName,
    site.destinationCountry,
    site.addressLine1
  ])

const registrationHead = [{ text: 'Org ID' }, { text: 'Registration Number' }]
const siteHead = [
  { text: 'Overseas reprocessor name' },
  { text: 'Destination country' },
  { text: 'Address line 1' }
]

const applicationsHead = { text: 'Applications' }

/** @param {RegistrationServiceSite} site */
const applicationsText = (site) =>
  site.applications
    .map(({ year, applicationStatus }) => `${year} ${applicationStatus}`)
    .join(', ')

/** @param {OverseasSiteMatches} matches */
const toGroups = (matches) => ({
  sameNumber: {
    id: 'same-number',
    emptyText: 'No sites match with the same ORS ID.',
    head: [
      ...registrationHead,
      { text: 'ORS ID' },
      ...siteHead,
      applicationsHead
    ],
    rows: matches.sameNumber.map(({ reEx, registrationService }) => [
      ...registrationCells(reEx),
      ...cells([reEx.orsId]),
      ...siteCells(reEx),
      { text: applicationsText(registrationService) }
    ])
  },
  differentNumber: {
    id: 'different-number',
    emptyText: 'No sites match with a different ORS ID.',
    head: [
      ...registrationHead,
      { text: 'Re-ex ORS ID' },
      { text: 'Registration service ORS ID' },
      ...siteHead,
      applicationsHead
    ],
    rows: matches.differentNumber.map(({ reEx, registrationService }) => [
      ...registrationCells(reEx),
      ...cells([reEx.orsId, registrationService.orsId]),
      ...siteCells(reEx),
      { text: applicationsText(registrationService) }
    ])
  },
  reExOnly: {
    id: 're-ex-only',
    emptyText: 'Every re-ex site matches a registration service site.',
    head: [
      ...registrationHead,
      { text: 'ORS ID' },
      ...siteHead,
      { text: 'Compare with the registration service' }
    ],
    rows: matches.reExOnly.map(({ site, nearMatches }) => [
      ...registrationCells(site),
      ...cells([site.orsId]),
      ...siteCells(site),
      { text: nearMatchesText(nearMatches) }
    ])
  },
  registrationServiceOnly: {
    id: 'registration-service-only',
    emptyText: 'Every registration service site matches a re-ex site.',
    head: [
      ...registrationHead,
      { text: 'ORS ID' },
      ...siteHead,
      applicationsHead,
      { text: 'Compare with re-ex' }
    ],
    rows: matches.registrationServiceOnly.map(({ site, nearMatches }) => [
      ...registrationCells(site),
      { text: site.orsId ?? 'Check: None' },
      ...siteCells(site),
      { text: applicationsText(site) },
      { text: nearMatchesText(nearMatches) }
    ])
  }
})

export const orsMatchesGetController = {
  /**
   * @param {HapiRequest} request
   * @param {ResponseToolkit} h
   */
  async handler(request, h) {
    const pageTitle = request.route.settings.app?.pageTitle

    try {
      const { years, year } = await reportYears(request)
      if (year === undefined) {
        return h.redirect(
          reportUrlForYear(orsUploadRoutes.matches, defaultReportYear(years))
        )
      }

      /** @type {[{ rows: OverseasSiteRow[] }, { rows: RegistrationServiceSiteRow[] }]} */
      const [reEx, registrationService] = await Promise.all([
        fetchJsonFromBackend(request, buildBackendPath({ year, all: true })),
        fetchRegistrationServiceSites(request)
      ])

      return h.view('routes/ors-upload/matches', {
        pageTitle,
        year,
        groups: toGroups(
          matchOverseasSites(reEx.rows, registrationService.rows)
        )
      })
    } catch (error) {
      logger.error({
        err: error,
        message: 'Failed to match the overseas reprocessing sites'
      })

      return h.view('routes/ors-upload/matches', {
        pageTitle,
        error:
          error instanceof RegistrationServiceError
            ? error.message
            : defaultErrorMessage
      })
    }
  }
}
