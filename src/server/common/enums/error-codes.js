/**
 * Error codes attached to enriched Boom errors via cdp-boom factories. Wire
 * values are lowercase snake_case for parity with backend and CDP indexing.
 */
export const errorCodes = {
  externalFetchFailed: 'external_fetch_failed',
  externalRedirectInvalid: 'external_redirect_invalid',
  registrationNotFound: 'registration_not_found'
}
