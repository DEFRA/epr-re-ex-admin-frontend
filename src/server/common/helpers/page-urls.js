import {
  accreditationPath,
  organisationPath,
  periodSubmissionPath,
  registrationPath
} from './backend-paths.js'

/**
 * @import { PeriodSubmissionParams } from './backend-paths.js'
 */

/**
 * Admin pages addressed by natural keys. The organisation and registration
 * overviews are still served by id, so these addresses redirect there.
 */

/**
 * @param {{ organisationNumber: string }} keys
 */
export const organisationOverviewUrl = (keys) =>
  `${organisationPath(keys)}/overview`

/**
 * @param {{ organisationNumber: string, registrationNumber: string }} keys
 */
export const registrationOverviewUrl = (keys) =>
  `${registrationPath(keys)}/overview`

/**
 * The breadcrumbs of a page under a registration.
 * @param {{ organisationNumber: string, registrationNumber: string }} keys
 */
export const registrationBreadcrumbs = (keys) => [
  { text: 'Organisations', href: '/organisations' },
  { text: 'Organisation overview', href: organisationOverviewUrl(keys) },
  { text: 'Registration overview', href: registrationOverviewUrl(keys) }
]

/**
 * A report submission's page, at the backend's path for now.
 * @param {PeriodSubmissionParams} params
 */
export const reportSubmissionUrl = (params) => periodSubmissionPath(params)

/**
 * @param {{ organisationNumber: string, registrationNumber: string, year: string }} keys
 */
export const wasteBalanceEventsUrl = (keys) =>
  `${accreditationPath(keys)}/waste-balance-events`

/**
 * @param {{ organisationNumber: string, registrationNumber: string, year: string }} keys
 */
export const overseasSitesUrl = (keys) =>
  `${accreditationPath(keys)}/overseas-sites`

/**
 * @param {PeriodSubmissionParams} params
 */
export const reportUnsubmitUrl = (params) =>
  `${reportSubmissionUrl(params)}/unsubmit`
