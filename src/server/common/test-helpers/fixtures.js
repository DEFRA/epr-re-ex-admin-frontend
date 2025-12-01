import { makeToken } from './test-constants.js'

export const mockUserSession = {
  sessionId: '123',
  displayName: ' John Doe',
  isAuthenticated: true,
  token: makeToken('user-token')
}
