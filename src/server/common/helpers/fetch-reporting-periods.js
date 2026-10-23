import { fetchJsonFromBackend } from './fetch-json-from-backend.js'
import { reportsCalendarPath } from './backend-paths.js'

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { PeriodSubmissionParams } from './backend-paths.js'
 */

/**
 * The registration's registered-only and accredited periods for the year as
 * one list, in date order. Each period carries its own cadence, as a
 * registration can hold both kinds in a year, and a stored report is listed
 * even outside its kind's periods unless the report routes refuse it.
 * @param {HapiRequest} request
 * @param {Pick<PeriodSubmissionParams, 'organisationNumber' | 'registrationNumber'> & { year: number }} keys
 * @returns {Promise<Record<string, any>[]>}
 */
export const fetchReportingPeriods = async (request, keys) => {
  const { registeredOnly, accredited } = await fetchJsonFromBackend(
    request,
    reportsCalendarPath(keys),
    {}
  )

  return [
    ...(registeredOnly?.reportingPeriods ?? []),
    ...(accredited?.reportingPeriods ?? [])
  ].sort((a, b) => a.startDate.localeCompare(b.startDate))
}
