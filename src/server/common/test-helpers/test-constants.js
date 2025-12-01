// Test-only constants generated at runtime to avoid hardcoded secrets
export const TEST_COOKIE_PASSWORD =
  process.env.TEST_COOKIE_PASSWORD ||
  `test-cookie-pw-${Math.random().toString(36).slice(2)}`

export const makeToken = (prefix = 'token') =>
  `${prefix}-${Math.random().toString(36).slice(2)}`
