import { errorCodes } from '#server/common/enums/error-codes.js'
import { notFound } from '#server/common/helpers/logging/cdp-boom.js'
import { redirectKeepingMethod } from '#server/common/helpers/redirect-keeping-method.js'
import { findOrganisationById } from './find-organisation.js'
import { routeKeyForm, urlKeyForm } from './key-form.js'
import { toNaturalKeys } from './swap-keys.js'

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
 * @param {RecordIds} ids
 * @returns {Promise<NaturalKeys | null>}
 */
const swapKeys = async (request, ids) => {
  const organisation = await findOrganisationById(request, ids.organisationId)

  return organisation && toNaturalKeys(organisation, ids)
}

/**
 * Sends a URL holding ids to its route's natural-key address (ADR 0053).
 * @param {HapiRequest} request
 * @param {ResponseToolkit} h
 */
export const naturalKeyRedirect = async (request, h) => {
  const route = routeKeyForm(request.route.path)

  if (route?.form !== 'naturalKeys') {
    return h.continue
  }

  const pathSegments = request.path.split('/')

  if (urlKeyForm(pathSegments, route.segments) !== 'ids') {
    return h.continue
  }

  const swapped = /** @type {Record<string, string> | null} */ (
    await swapKeys(
      request,
      /** @type {RecordIds} */ (readKeys(pathSegments, route.segments, 'ids'))
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
