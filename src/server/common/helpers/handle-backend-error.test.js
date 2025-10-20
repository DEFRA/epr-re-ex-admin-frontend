import { vi } from 'vitest'
import { handleBackendError } from './handleBackendError.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

describe('#handleBackendError', () => {
  let h
  let viewReturn

  beforeEach(() => {
    viewReturn = { rendered: true }
    h = { view: vi.fn().mockReturnValue(viewReturn) }
  })

  test('Should render unauthorised view when response status is 401', async () => {
    const response = { status: statusCodes.unauthorised, ok: false }

    const result = await handleBackendError(h, response)

    expect(h.view).toHaveBeenCalledWith('unauthorised')
    expect(result).toBe(viewReturn)
  })

  test('Should render 500 view when response is non-OK (e.g., 500)', async () => {
    const response = { status: statusCodes.internalServerError, ok: false }

    const result = await handleBackendError(h, response)

    expect(h.view).toHaveBeenCalledWith('500')
    expect(result).toBe(viewReturn)
  })

  test('Should render 500 view when response is non-OK (e.g., 403)', async () => {
    const response = { status: statusCodes.forbidden, ok: false }

    const result = await handleBackendError(h, response)

    expect(h.view).toHaveBeenCalledWith('500')
    expect(result).toBe(viewReturn)
  })

  test('Should do nothing (return undefined) when response is OK', async () => {
    const response = { status: statusCodes.ok, ok: true }

    const result = await handleBackendError(h, response)

    expect(h.view).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
