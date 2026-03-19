import { vi, describe, test, expect, beforeEach } from 'vitest'
import { audit } from '@defra/cdp-auditing'
import {
  auditSignIn,
  auditSignOut,
  auditOrsStatusCheckSucceeded,
  auditOrsStatusCheckFailed
} from './index.js'

vi.mock('@defra/cdp-auditing', () => ({
  audit: vi.fn(),
  enableAuditing: vi.fn()
}))

const mockUserSession = {
  userId: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  sessionId: 'session-456'
}

describe('#auditing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('auditSignIn', () => {
    test('Should call audit with sign-in event and user details', () => {
      auditSignIn(mockUserSession)

      expect(audit).toHaveBeenCalledWith({
        event: {
          category: 'access',
          subCategory: 'sso',
          action: 'sign-in'
        },
        context: {},
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      })
    })

    test('Should handle missing user session fields gracefully', () => {
      auditSignIn({})

      expect(audit).toHaveBeenCalledWith({
        event: {
          category: 'access',
          subCategory: 'sso',
          action: 'sign-in'
        },
        context: {},
        user: {
          id: undefined,
          email: undefined
        }
      })
    })
  })

  describe('auditSignOut', () => {
    test('Should call audit with sign-out event and user details', () => {
      auditSignOut(mockUserSession)

      expect(audit).toHaveBeenCalledWith({
        event: {
          category: 'access',
          subCategory: 'sso',
          action: 'sign-out'
        },
        context: {},
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      })
    })

    test('Should handle missing user session fields gracefully', () => {
      auditSignOut({})

      expect(audit).toHaveBeenCalledWith({
        event: {
          category: 'access',
          subCategory: 'sso',
          action: 'sign-out'
        },
        context: {},
        user: {
          id: undefined,
          email: undefined
        }
      })
    })
  })

  describe('ORS upload status auditing', () => {
    test('Should audit ORS status check success', () => {
      auditOrsStatusCheckSucceeded({
        userSession: mockUserSession,
        importId: 'import-123',
        status: 'completed'
      })

      expect(audit).toHaveBeenCalledWith({
        event: {
          category: 'data',
          subCategory: 'ors-upload',
          action: 'status-check-succeeded'
        },
        context: {
          importId: 'import-123',
          status: 'completed'
        },
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      })
    })

    test('Should audit ORS status check failure with error details', () => {
      auditOrsStatusCheckFailed({
        userSession: mockUserSession,
        importId: 'import-123',
        errorStatusCode: 404,
        errorMessage: 'Import not found'
      })

      expect(audit).toHaveBeenCalledWith({
        event: {
          category: 'data',
          subCategory: 'ors-upload',
          action: 'status-check-failed'
        },
        context: {
          importId: 'import-123',
          errorStatusCode: 404,
          errorMessage: 'Import not found'
        },
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      })
    })
  })
})
