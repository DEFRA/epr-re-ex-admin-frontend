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
 * @import { NearMatch, NearMatchReason, OverseasSiteMatches, RegistrationServiceSite, NumberHolder, RenumberedPair, Renumbering } from './overseas-site-matching.js'
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

/** @param {Pick<OverseasSiteRow, 'overseasReprocessorName' | 'addressLine1'>} site */
const siteText = (site) =>
  `${toDisplayValue(site.overseasReprocessorName)}, ${toDisplayValue(site.addressLine1)}`

/** @param {NearMatch[]} nearMatches */
const nearMatchesText = (nearMatches) =>
  nearMatches.length
    ? nearMatches
        .map(
          (nearMatch) =>
            `Check: ORS ID ${orsIdText(nearMatch.orsId)}, ${siteText(nearMatch)} (${nearMatchReasons[nearMatch.reason]})`
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
    .map(
      ({ year, applicationStatus, selected }) =>
        `${year} ${applicationStatus}${selected ? '' : ' (deselected)'}`
    )
    .join(', ')

/** @param {OverseasSiteMatches['sameNumber']} pairs */
const sameNumberGroup = (pairs) => ({
  id: 'same-number',
  emptyText: 'No sites match with the same ORS ID.',
  head: [
    ...registrationHead,
    { text: 'ORS ID' },
    ...siteHead,
    applicationsHead
  ],
  rows: pairs.map(({ reEx, registrationService }) => [
    ...registrationCells(reEx),
    ...cells([reEx.orsId]),
    ...siteCells(reEx),
    { text: applicationsText(registrationService) }
  ])
})

/** @type {Record<Exclude<Renumbering, 'free'>, string>} */
const renumberingLabels = {
  clash: 'Clash',
  chain: 'Chain',
  swap: 'Swap'
}

/** @param {NumberHolder} holder */
const holderText = ({ site, movesTo }) => {
  const move = movesTo ? 'moves to ' + movesTo : 'keeps it'
  return `${siteText(site)} (${move})`
}

/** @param {RenumberedPair} pair */
const renumberingText = ({ renumbering, reExNumberHolders }) =>
  renumbering === 'free'
    ? '-'
    : `${renumberingLabels[renumbering]}: ${reExNumberHolders.map(holderText).join('; ')}`

/** @param {OverseasSiteRow[]} reExSites */
const numberNeededByText = (reExSites) =>
  reExSites.length
    ? `${renumberingLabels.clash}: ${reExSites.map(siteText).join('; ')}`
    : '-'

/** @param {OverseasSiteMatches['differentNumber']} pairs */
const differentNumberGroup = (pairs) => ({
  id: 'different-number',
  emptyText: 'No sites match with a different ORS ID.',
  head: [
    ...registrationHead,
    { text: 'Re-ex ORS ID' },
    { text: 'Registration service ORS ID' },
    ...siteHead,
    applicationsHead,
    { text: 'Re-ex ORS ID already held by' }
  ],
  rows: pairs.map((pair) => [
    ...registrationCells(pair.reEx),
    ...cells([pair.reEx.orsId, pair.registrationService.orsId]),
    ...siteCells(pair.reEx),
    { text: applicationsText(pair.registrationService) },
    { text: renumberingText(pair) }
  ])
})

/** @param {OverseasSiteMatches['reExOnly']} sites */
const reExOnlyGroup = (sites) => ({
  id: 're-ex-only',
  emptyText: 'Every re-ex site matches a registration service site.',
  head: [
    ...registrationHead,
    { text: 'ORS ID' },
    ...siteHead,
    { text: 'Compare with the registration service' }
  ],
  rows: sites.map(({ site, nearMatches }) => [
    ...registrationCells(site),
    ...cells([site.orsId]),
    ...siteCells(site),
    { text: nearMatchesText(nearMatches) }
  ])
})

/** @param {OverseasSiteMatches['registrationServiceOnly']} sites */
const registrationServiceOnlyGroup = (sites) => ({
  id: 'registration-service-only',
  emptyText: 'Every registration service site matches a re-ex site.',
  head: [
    ...registrationHead,
    { text: 'ORS ID' },
    ...siteHead,
    applicationsHead,
    { text: 'Compare with re-ex' },
    { text: 'ORS ID needed back by' }
  ],
  rows: sites.map(({ site, nearMatches, numberNeededBy }) => [
    ...registrationCells(site),
    { text: site.orsId ?? 'Check: None' },
    ...siteCells(site),
    { text: applicationsText(site) },
    { text: nearMatchesText(nearMatches) },
    { text: numberNeededByText(numberNeededBy) }
  ])
})

/** @param {OverseasSiteMatches} matches */
const toGroups = (matches) => ({
  sameNumber: sameNumberGroup(matches.sameNumber),
  differentNumber: differentNumberGroup(matches.differentNumber),
  reExOnly: reExOnlyGroup(matches.reExOnly),
  registrationServiceOnly: registrationServiceOnlyGroup(
    matches.registrationServiceOnly
  )
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
