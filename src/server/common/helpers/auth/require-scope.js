import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from './get-user-session.js'

/**
 * Hapi pre-handler that gates a route on the presence of an `admin.*` scope
 * on the user's session. Used for pages whose entire purpose is a write
 * action (queue management, report unsubmit, etc.) so a read-only user does
 * not see a partially-rendered page they cannot use.
 *
 * Frontend hiding is UX, not security — backend scope checks remain the
 * actual gate. This pre-handler exists to render a clear 403 page rather
 * than letting the backend 403 surface as a generic error after a render.
 *
 * @param {string} scope - Required scope, e.g. 'admin.write' or 'admin.dlq.purge'.
 * @returns {{ method: import('@hapi/hapi').Lifecycle.Method }}
 */
export function requireScope(scope) {
  return {
    method: async (request, h) => {
      const session = await getUserSession(request)
      if (!session?.scopes?.includes(scope)) {
        request.logger.info({
          message: `Route requires scope ${scope} but user has [${(session?.scopes ?? []).join(', ')}]; rendering 403`
        })
        return h.view('403').code(statusCodes.forbidden).takeover()
      }
      return h.continue
    }
  }
}
