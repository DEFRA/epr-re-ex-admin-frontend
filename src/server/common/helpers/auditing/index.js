import { audit } from '@defra/cdp-auditing'

function auditSignIn(request) {
  const payload = {
    event: {
      category: 'access',
      subCategory: 'sso',
      action: 'sign-in'
    },
    context: {},
    user: extractUserDetails(request)
  }

  audit(payload)
}

function extractUserDetails(request) {
  return {
    id: request.auth?.credentials?.profile?.id,
    email: request.auth?.credentials?.profile?.email
  }
}

export { auditSignIn }
