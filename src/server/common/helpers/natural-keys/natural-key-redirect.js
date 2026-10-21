import { errorCodes } from '#server/common/enums/error-codes.js'
import { notFound } from '#server/common/helpers/logging/cdp-boom.js'
import { redirectKeepingMethod } from '#server/common/helpers/redirect-keeping-method.js'
import { findOverviewById, findOverviewByNumber } from './find-overview.js'
import { routeKeyForm, urlKeyForm } from './key-form.js'
import { toIds, toNaturalKeys } from './swap-keys.js'

/**
 * @import { ResponseToolkit } from '@hapi/hapi'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { KeyForm, KeyedRecord, KeyedSegment } from './key-form.js'
 * @import { NaturalKeys, RecordIds } from './swap-keys.js'
 */

/** @type {Record<KeyForm, Record<KeyedRecord, string>>} */
const FIELDS = {
  ids: {
    organisation: 'organisationId',
    registration: 'registrationId',
    accreditation: 'accreditationId'
  },
  naturalKeys: {
    organisation: 'organisationNumber',
    registration: 'registrationNumber',
    accreditation: 'year'
  }
}

/**
 * @param {string[]} pathSegments
 * @param {KeyedSegment[]} segments
 * @param {KeyForm} form
 * @returns {Record<string, string>}
 */
const readKeys = (pathSegments, segments, form) =>
  Object.fromEntries(
    segments.map(({ index, record }) => [
      FIELDS[form][record],
      decodeURIComponent(pathSegments[index])
    ])
  )

/**
 * @param {HapiRequest} request
 * @param {KeyForm} form - the form the URL holds
 * @param {Record<string, string>} keys
 * @returns {Promise<RecordIds | NaturalKeys | null>}
 */
const swapKeys = async (request, form, keys) => {
  if (form === 'ids') {
    const ids = /** @type {RecordIds} */ (keys)
    const overviewById = await findOverviewById(request, ids.organisationId)

    return overviewById && toNaturalKeys(overviewById, ids)
  }

  const naturalKeys = /** @type {NaturalKeys} */ (keys)
  const overviewByNumber = await findOverviewByNumber(
    request,
    naturalKeys.organisationNumber
  )

  return overviewByNumber && toIds(overviewByNumber, naturalKeys)
}

/**
 * Sends a page URL holding ids to its route's natural-key address, and the
 * reverse, while pages move to natural keys (ADR 0053).
 * @param {HapiRequest} request
 * @param {ResponseToolkit} h
 */
export const naturalKeyRedirect = async (request, h) => {
  const route = routeKeyForm(request.route.path)

  if (!route) {
    return h.continue
  }

  const pathSegments = request.path.split('/')
  const urlForm = urlKeyForm(pathSegments, route.segments)

  if (!urlForm || urlForm === route.form) {
    return h.continue
  }

  const swapped = /** @type {Record<string, string> | null} */ (
    await swapKeys(
      request,
      urlForm,
      readKeys(pathSegments, route.segments, urlForm)
    )
  )

  if (!swapped) {
    throw notFound('Record not found by key', errorCodes.recordKeyUnresolved, {
      event: { action: 'redirect_by_key', reason: 'unresolved' }
    })
  }

  for (const { index, record } of route.segments) {
    pathSegments[index] = encodeURIComponent(
      swapped[FIELDS[route.form][record]]
    )
  }

  return redirectKeepingMethod(request, h, pathSegments.join('/'))
}
