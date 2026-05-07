import { makeToken } from './test-constants.js'

export const mockUserSession = {
  userId: 'user-id',
  email: 'user@email.com',
  sessionId: '123',
  displayName: ' John Doe',
  isAuthenticated: true,
  role: 'service_maintainer_write',
  scopes: ['admin.read', 'admin.write', 'admin.dlq.purge'],
  token: makeToken('user-token'),
  refreshToken: makeToken('refresh-token')
}
