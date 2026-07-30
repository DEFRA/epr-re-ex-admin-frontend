import { vi, describe, test, expect, beforeEach } from 'vitest'
import { audit } from '@defra/cdp-auditing'
import { auditSignIn, auditSignOut } from './index.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'

vi.mock('@defra/cdp-auditing', () => ({
  audit: vi.fn(),
  enableAuditing: vi.fn()
}))

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
          id: mockUserSession.userId,
          email: mockUserSession.email
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
          id: mockUserSession.userId,
          email: mockUserSession.email
        }
      })
    })
  })
})
