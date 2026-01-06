import { makeToken } from './test-constants.js'

export const mockUserSession = {
  userId: 'user-id',
  email: 'user@email.com',
  sessionId: '123',
  displayName: ' John Doe',
  isAuthenticated: true,
  token: makeToken('user-token'),
  refreshToken: makeToken('refresh-token')
}
