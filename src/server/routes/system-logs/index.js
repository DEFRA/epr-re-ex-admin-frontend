import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import transform from 'lodash/transform.js'
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
                previous: systemLog.context.previous,
                next: systemLog.context.next,
                difference: difference(
                  systemLog.context.previous,
                  systemLog.context.next
                )
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

function difference(previous, next) {
  let arrayIndexCounter = 0
  return transform(next, (result, nextValue, key) => {
    const previousValue = previous[key]
    if (isEqual(nextValue, previousValue)) {
      return
    }

    const resultKey = isArray(previous) ? arrayIndexCounter : key

    result[resultKey] =
      isObject(nextValue) && isObject(previousValue)
        ? difference(previousValue, nextValue)
        : renderChange(previousValue, nextValue)

    if (isArray(previous)) {
      arrayIndexCounter++
    }
  })
}

function renderChange(a, b) {
  if (isSimple(a) && isSimple(b)) {
    if (!a) {
      return `(added) ${b}`
    }
    return `${a} -> ${b}`
  }

  return ['(added)', b]
}

function isSimple(x) {
  return !isObject(x) && !isArray(x)
}
