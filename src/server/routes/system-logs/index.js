import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import isEqual from 'lodash/isEqual.js'
import isArray from 'lodash/isArray.js'
import isObject from 'lodash/isObject.js'

export const systemLogs = {
  plugin: {
    name: 'system-logs',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/system-logs',
          options: {
            app: { pageTitle: 'System logs' }
          },
          async handler(request, h) {
            const searchTermReferenceNumber = request.query?.referenceNumber
            const params = new URLSearchParams({
              organisationId: searchTermReferenceNumber
            })

            const data = await fetchJsonFromBackend(
              request,
              `/v1/system-logs?${params.toString()}`
            )

            return h.view('routes/system-logs/index', {
              pageTitle: request.route.settings.app.pageTitle,
              systemLogs: data.systemLogs.map((systemLog) => ({
                timestamp: systemLog.createdAt,
                event: systemLog.event,
                user: systemLog.createdBy,
                context: mapContext(systemLog)
              })),
              searchTerms: {
                referenceNumber: searchTermReferenceNumber
              }
            })
          }
        }
      ])
    }
  }
}

function mapContext({ event, context }) {
  if (
    event.category === 'entity' &&
    event.subCategory === 'epr-organisations' &&
    event.action === 'update'
  ) {
    return organisationUpdate(context)
  }

  return { ...context } // return the whole context, for rendering as-is
}

function organisationUpdate(context) {
  return {
    contextType: 'organisation-update',
    previous: context.previous,
    next: context.next,
    difference: difference(context.previous, context.next) || ''
  }
}

function difference(previous, next) {
  if (isEqual(previous, next)) {
    return undefined
  }
  if (isSimple(previous) || isSimple(next)) {
    return renderChange(previous, next)
  }

  const allKeysDeDuped = [...new Set([previous, next].flatMap(Object.keys))]
  return allKeysDeDuped.reduce((acc, key) => {
    const diff = difference(previous[key], next[key])
    if (diff) {
      acc[key] = diff
    }
    return acc
  }, {})
}

function renderChange(a, b) {
  if (isSimple(a) && isSimple(b)) {
    if (!a) {
      return { _added: b }
    }
    if (!b) {
      return { _removed: a }
    }
    return { _changed: `${a} -> ${b}` }
  }

  if (!a) {
    return { _added: b }
  }

  if (!b) {
    return { _removed: a }
  }

  return { _previous: a, _next: b }
}

function isSimple(x) {
  return x === undefined || x === null || (!isObject(x) && !isArray(x))
}
