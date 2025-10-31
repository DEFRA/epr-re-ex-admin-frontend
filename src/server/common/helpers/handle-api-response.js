import Boom from '@hapi/boom'
import { statusCodes } from '#server/common/constants/status-codes.js'

const HIGHEST_SUCCESS_STATUS_CODE = 299

function handleApiResponse({ res, data }) {
  if (
    !res.statusCode ||
    res.statusCode < statusCodes.ok ||
    res.statusCode > HIGHEST_SUCCESS_STATUS_CODE
  ) {
    return { res, error: data || Boom.boomify(new Error('Unknown error')) }
  }

  return { res, data }
}

export { handleApiResponse }
