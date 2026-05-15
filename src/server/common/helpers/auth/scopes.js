/**
 * Admin scope identifiers. Mirrors the SCOPES constant in epr-backend
 * (src/common/helpers/auth/constants.js) — the strings must match exactly,
 * because they are compared against the values the backend puts on the
 * user session via /v1/admin/me.
 *
 * Exposed to nunjucks templates via globals so views can write
 * `{% if SCOPES.adminWrite in scopes %}` instead of magic strings.
 */
export const SCOPES = Object.freeze({
  adminRead: 'admin.read',
  adminWrite: 'admin.write',
  adminDlqPurge: 'admin.dlq.purge'
})
