import { isNil } from '#server/common/helpers/is-nil.js'
import isEqual from 'lodash/isEqual.js'
import isArray from 'lodash/isArray.js'
import isObject from 'lodash/isObject.js'

export function transformSystemLog(systemLog) {
  return {
    timestamp: systemLog.createdAt,
    event: systemLog.event,
    user: systemLog.createdBy,
    ...contextWithDeltaBetweenPreviousAndNextExtracted(systemLog)
  }
}

function contextWithDeltaBetweenPreviousAndNextExtracted({ context }) {
  const { previous, next, ...remainingContext } = context
  const hasPrevious = 'previous' in context
  const hasNext = 'next' in context
  if (hasPrevious || hasNext) {
    return {
      renderDelta: {
        ...(hasPrevious ? { previous } : {}),
        ...(hasNext ? { next } : {}),
        ...(hasPrevious && hasNext
          ? { difference: difference(previous, next) || 'no differences' }
          : {})
      },
      context: { ...remainingContext }
    }
  }

  return { context }
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
  return isNil(x) || (!isObject(x) && !isArray(x))
}
