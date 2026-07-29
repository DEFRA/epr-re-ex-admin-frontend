import { createTransitionPostController } from './controller.post.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/** @import {RegistrationStatusTransition} from './transitions.js' */

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockFetchJsonFromBackend = vi.mocked(fetchJsonFromBackend)

// Registration transitions currently registered (transitions.js) all collect
// grant fields, so the "no grant fields" branch of the shared post-controller
// factory can't be reached through a real route yet. It's still a genuine,
// designed-for case — the sibling accreditation module has transitions
// without grant fields — so it's covered here directly against the factory.
describe('createTransitionPostController without grant fields', () => {
  const organisationId = 'org-1'
  const registrationId = 'reg-1'
  const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

  /** @type {RegistrationStatusTransition} */
  const fakeTransition = {
    fromStatus: 'approved',
    toStatus: 'cancelled',
    pageTitle: 'Cancel registration',
    heading: 'Cancel registration',
    warningText: 'This is a fake transition used only to test the factory.',
    buttonText: 'Cancel registration now',
    buttonClasses: 'govuk-button--warning',
    errorMessage:
      'There was a problem cancelling the registration. Please try again.',
    logMessage: 'Cancel registration failed'
  }

  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest = {
      params: { organisationId, registrationId },
      payload: {},
      logger: { error: vi.fn() },
      yar: { set: vi.fn() }
    }
    mockH = {
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
  })

  test('posts only fromStatus/toStatus and redirects to the overview', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({ status: 'cancelled' })

    const controller = createTransitionPostController('cancel', fakeTransition)
    const result = await controller.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/status-history`,
      {
        method: 'POST',
        body: JSON.stringify({ fromStatus: 'approved', toStatus: 'cancelled' })
      }
    )
    expect(mockH.redirect).toHaveBeenCalledWith(overviewUrl)
    expect(result).toBe('redirect-response')
  })

  test('a backend failure flashes the transition error and redirects to the overview', async () => {
    mockFetchJsonFromBackend.mockRejectedValue({
      output: { statusCode: 422, payload: { message: undefined } }
    })

    const controller = createTransitionPostController('cancel', fakeTransition)
    await controller.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      fakeTransition.errorMessage
    )
    expect(mockH.redirect).toHaveBeenCalledWith(overviewUrl)
  })
})
