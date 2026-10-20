import { statusCodes } from '#server/common/constants/status-codes.js'
import { periodSubmissionPath } from './backend-paths.js'

/**
 * @import { Lifecycle } from '@hapi/hapi'
 * @import { PeriodSubmissionParams } from './backend-paths.js'
 */

const SUBMISSION = '{period}/submissions/{submissionNumber}'
const REGISTRATION =
  '/organisations/{organisationNumber}/registrations/{registrationNumber}'

/**
 * Where a report submission's pages hang: under the registration for a
 * registered-only report, under the accreditation for its year for an
 * accredited one, as the backend addresses them.
 */
export const REPORT_SUBMISSION_PATHS = [
  `${REGISTRATION}/reports/{year}/{cadence}/${SUBMISSION}`,
  `${REGISTRATION}/accreditations/{year}/reports/{cadence}/${SUBMISSION}`
]

/**
 * Sends a report page reached at the other report path to the one its cadence
 * lives at. An old id URL for an accredited report arrives at the
 * registration's path once its ids are swapped for numbers.
 * @param {string} [action] - the page's path after the submission
 * @returns {{ method: Lifecycle.Method }}
 */
export const atReportAddress = (action = '') => ({
  method: (request, h) => {
    const params = /** @type {PeriodSubmissionParams} */ (request.params)
    const address = `${periodSubmissionPath(params)}${action}`

    if (request.path === address) {
      return h.continue
    }

    return h
      .redirect(`${address}${request.url.search}`)
      .code(
        request.method === 'get'
          ? statusCodes.found
          : statusCodes.temporaryRedirect
      )
      .takeover()
  }
})
