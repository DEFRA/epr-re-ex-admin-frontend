import Boom from '@hapi/boom'
import { statusCodes } from '#server/common/constants/status-codes.js'

const HIGHEST_SUCCESS_STATUS_CODE = 299

function handleApiResponse({ res, payload }) {
  if (
    !res.statusCode ||
    res.statusCode < statusCodes.ok ||
    res.statusCode > HIGHEST_SUCCESS_STATUS_CODE
  ) {
    return { res, error: payload || Boom.boomify(new Error('Unknown error')) }
  }

  return { res, payload }
}

export { handleApiResponse }
