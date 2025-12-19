import { audit } from '@defra/cdp-auditing'

function auditSignIn(userSession) {
  const payload = {
    event: {
      category: 'access',
      subCategory: 'sso',
      action: 'sign-in'
    },
    context: {},
    user: extractUserDetails(userSession)
  }

  audit(payload)
}

function auditSignOut(userSession) {
  const payload = {
    event: {
      category: 'access',
      subCategory: 'sso',
      action: 'sign-out'
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
 * @param {object} userSession
 * @returns {{ id: string, email: string }}
 */
function extractUserDetails(userSession) {
  return {
    id: userSession?.userId,
    email: userSession?.email
  }
}

export { auditSignIn, auditSignOut }
