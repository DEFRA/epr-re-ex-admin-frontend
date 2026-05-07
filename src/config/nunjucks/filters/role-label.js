const ADMIN_ROLE_LABELS = {
  service_maintainer_write: 'Service maintainer (write)',
  service_maintainer: 'Service maintainer',
  support: 'Support'
}

/**
 * Maps a snake_case admin role string (as returned by GET /v1/admin/me) to
 * its human-readable tier label. Returns an empty string when the role is
 * null/unknown so templates render cleanly for unauthenticated views.
 *
 * @param {string | null | undefined} role
 * @returns {string}
 */
export function roleLabel(role) {
  return ADMIN_ROLE_LABELS[role] ?? ''
}
