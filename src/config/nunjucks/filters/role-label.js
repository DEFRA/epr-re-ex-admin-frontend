import { SCOPES } from '#server/common/helpers/auth/scopes.js'

/**
 * Derives the human-readable admin tier label from the scopes bundle returned
 * by GET /v1/admin/me. Scopes are the source of truth — the backend no longer
 * exposes a role identifier. Returns an empty string for an empty/null scope
 * list so templates render cleanly for unauthenticated views.
 *
 * Mapping mirrors the backend `ADMIN_ROLES` bundles:
 *   admin.write present  → "Service maintainer (write)"
 *   admin.dlq.purge      → "Service maintainer"  (without write)
 *   admin.read only      → "Support"
 *
 * @param {string[] | null | undefined} scopes
 * @returns {string}
 */
export function roleLabel(scopes) {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    return ''
  }
  if (scopes.includes(SCOPES.adminWrite)) {
    return 'Service maintainer (write)'
  }
  if (scopes.includes(SCOPES.adminDlqPurge)) {
    return 'Service maintainer'
  }
  if (scopes.includes(SCOPES.adminRead)) {
    return 'Support'
  }
  return ''
}
