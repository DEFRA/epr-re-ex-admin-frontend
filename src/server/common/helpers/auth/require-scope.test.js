import { vi, describe, test, beforeEach, expect } from 'vitest'

import { requireScope } from './require-scope.js'
import { getUserSession } from './get-user-session.js'

vi.mock('./get-user-session.js')

describe('#requireScope', () => {
  const mockToolkit = () => ({
    view: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis(),
    takeover: vi.fn().mockReturnValue('forbidden-takeover'),
    continue: 'continue-symbol'
  })

  const mockRequest = () => ({
    logger: { info: vi.fn() }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns h.continue when the session carries the required scope', async () => {
    getUserSession.mockResolvedValue({
      scopes: ['admin.read', 'admin.write']
    })

    const guard = requireScope('admin.write')
    const h = mockToolkit()

    const result = await guard.method(mockRequest(), h)

    expect(result).toBe(h.continue)
    expect(h.view).not.toHaveBeenCalled()
  })

  test('renders the 403 view when the session lacks the required scope', async () => {
    getUserSession.mockResolvedValue({ scopes: ['admin.read'] })

    const guard = requireScope('admin.write')
    const h = mockToolkit()

    const result = await guard.method(mockRequest(), h)

    expect(h.view).toHaveBeenCalledWith('403')
    expect(h.code).toHaveBeenCalledWith(403)
    expect(h.takeover).toHaveBeenCalled()
    expect(result).toBe('forbidden-takeover')
  })

  test('renders the 403 view when there is no session at all', async () => {
    getUserSession.mockResolvedValue(null)

    const guard = requireScope('admin.write')
    const h = mockToolkit()

    await guard.method(mockRequest(), h)

    expect(h.view).toHaveBeenCalledWith('403')
    expect(h.code).toHaveBeenCalledWith(403)
  })

  test('renders the 403 view when scopes is missing entirely', async () => {
    getUserSession.mockResolvedValue({ userId: 'u1' })

    const guard = requireScope('admin.dlq.purge')
    const h = mockToolkit()

    await guard.method(mockRequest(), h)

    expect(h.view).toHaveBeenCalledWith('403')
  })

  test('matches by exact scope string (admin.read does not satisfy admin.write)', async () => {
    getUserSession.mockResolvedValue({
      scopes: ['admin.read', 'admin.dlq.purge']
    })

    const guard = requireScope('admin.write')
    const h = mockToolkit()

    await guard.method(mockRequest(), h)

    expect(h.view).toHaveBeenCalledWith('403')
  })
})
