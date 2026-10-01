import { audit } from '@defra/cdp-auditing'

/**
 * @import { UserSession } from '#server/common/hapi-types.js'
 */

/**
 * @param {UserSession} userSession
 */
function auditSignIn(userSession) {
  auditSSO('sign-in', userSession)
}

/**
 * @param {UserSession} userSession
 */
function auditSignOut(userSession) {
  auditSSO('sign-out', userSession)
}

/**
 * @param {string} action
 * @param {UserSession} userSession
 */
function auditSSO(action, userSession) {
  const payload = {
    event: {
      category: 'access',
      subCategory: 'sso',
      action
    },
    context: {},
    user: extractUserDetails(userSession)
  }

  audit(payload)
}

/**
 * Note this pulls data from user session rather than
 * request.auth.credentials (as per auditing in epr-backend) because
 * - for endpoints protected by entra-id strategy user details are on auth.credentials.profile
 * - for endpoints protected by session strategy user details are on auth.credentials
 *
 * @param {UserSession} userSession
 * @returns {{ id: string, email: string }}
 */
function extractUserDetails(userSession) {
  return {
    id: userSession.userId,
    email: userSession.email
  }
}

export { auditSignIn, auditSignOut }
