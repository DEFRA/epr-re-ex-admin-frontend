/**
 * @typedef {'ids' | 'naturalKeys'} KeyForm
 * @typedef {'organisation' | 'registration' | 'accreditation'} KeyedRecord
 * @typedef {{ index: number, record: KeyedRecord }} KeyedSegment
 */

/**
 * Each parameter that addresses a record, with the literal it must follow.
 * @type {Record<string, { literal: string, record: KeyedRecord, form: KeyForm }>}
 */
const KEYED_PARAMS = {
  '{organisationId}': {
    literal: 'organisations',
    record: 'organisation',
    form: 'ids'
  },
  '{registrationId}': {
    literal: 'registrations',
    record: 'registration',
    form: 'ids'
  },
  '{accreditationId}': {
    literal: 'accreditations',
    record: 'accreditation',
    form: 'ids'
  },
  '{organisationNumber}': {
    literal: 'organisations',
    record: 'organisation',
    form: 'naturalKeys'
  },
  '{registrationNumber}': {
    literal: 'registrations',
    record: 'registration',
    form: 'naturalKeys'
  },
  '{year}': {
    literal: 'accreditations',
    record: 'accreditation',
    form: 'naturalKeys'
  }
}

const ID = /^[0-9a-f]{24}$/

/**
 * Whether a path value is a database id rather than a natural key.
 * @param {string} value
 * @returns {boolean}
 */
export const isDatabaseId = (value) => ID.test(value)

/**
 * The key form a route addresses its records by, or `null` when it names none
 * or mixes the two.
 * @param {string} routePath - `request.route.path`
 * @returns {{ form: KeyForm, segments: KeyedSegment[] } | null}
 */
export const routeKeyForm = (routePath) => {
  const parts = routePath.split('/')

  // `previous` is the segment before `part`, so the first segment is skipped
  const keyed = parts.slice(1).flatMap((part, previous) => {
    const param = KEYED_PARAMS[part]

    return param?.literal === parts[previous]
      ? [{ index: previous + 1, record: param.record, form: param.form }]
      : []
  })

  const forms = new Set(keyed.map(({ form }) => form))

  if (forms.size !== 1) {
    return null
  }

  return {
    form: keyed[0].form,
    segments: keyed.map(({ index, record }) => ({ index, record }))
  }
}

/**
 * Natural keys have no guaranteed format, so anything not an id is one.
 * @param {string} value
 * @returns {KeyForm}
 */
const keyFormOf = (value) => (isDatabaseId(value) ? 'ids' : 'naturalKeys')

/**
 * The key form of a URL's values, or `null` when they mix the two.
 * @param {string[]} pathSegments - `request.path.split('/')`
 * @param {KeyedSegment[]} segments
 * @returns {KeyForm | null}
 */
export const urlKeyForm = (pathSegments, segments) => {
  const forms = new Set(
    segments.map(({ index }) => keyFormOf(pathSegments[index]))
  )

  return forms.size === 1 ? [...forms][0] : null
}
