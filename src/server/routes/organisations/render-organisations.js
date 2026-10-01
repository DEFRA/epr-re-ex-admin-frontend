import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { CRITERIA_KEYS, hasAnyCriterion } from './criteria.js'
import { toSlimOrganisation } from './helpers.js'
import { PAGE_SIZE, buildPaginationLinks } from './pagination.js'

/**
 * @import { ResponseObject, ResponseToolkit } from '@hapi/hapi'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { SearchCriteria } from './criteria.js'
 */

/**
 * Fetches a page of organisations narrowed by the given search criteria and
 * renders the organisations table. Shared by the GET and POST routes so both
 * forward, echo back and paginate the criteria identically.
 *
 * The page number always comes from the query string: a POST is a fresh search
 * and so always asks for page 1.
 *
 * @param {HapiRequest} request
 * @param {ResponseToolkit} h
 * @param {SearchCriteria} criteria
 * @returns {Promise<ResponseObject>}
 */
export const renderOrganisations = async (request, h, criteria) => {
  const page = Number(request.query.page) || 1

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE)
  })

  for (const key of CRITERIA_KEYS) {
    if (criteria[key]) {
      params.set(key, criteria[key])
    }
  }

  const data = await fetchJsonFromBackend(
    request,
    `/v1/organisations?${params}`
  )

  const pageTitle = request.route.settings.app?.pageTitle

  return h.view('routes/organisations/index', {
    pageTitle,
    heading: pageTitle,
    criteria,
    hasCriteria: hasAnyCriterion(criteria),
    organisations: data.items.map(toSlimOrganisation),
    pagination: buildPaginationLinks({
      page: data.page,
      totalPages: data.totalPages,
      criteria
    })
  })
}
