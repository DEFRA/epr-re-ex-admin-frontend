import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

const GENERIC_FAILURE_REASON =
  'There was a problem cancelling the PRN. Please try again.'

export const prnCancelPostController = {
  async handler(request, h) {
    const { prnId } = request.params
    const {
      prnNumber,
      organisationName,
      issuedTo,
      tonnage,
      material,
      accreditationNumber,
      accreditationYear
    } = request.payload

    const displayFields = {
      prnNumber,
      organisationName,
      issuedTo,
      tonnage,
      material,
      accreditationNumber,
      accreditationYear
    }

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/admin/packaging-recycling-notes/${prnId}/cancel`,
        { method: 'POST' }
      )

      return h.view('routes/prn-cancel/result', {
        pageTitle: 'Cancel PRN',
        success: true,
        overviewUrl: '/prn-activity',
        ...displayFields
      })
    } catch (error) {
      request.logger.error({ err: error, message: 'Cancel PRN failed' })

      const { statusCode, payload } = error.output
      const reason =
        statusCode < statusCodes.internalServerError && payload?.message
          ? payload.message
          : GENERIC_FAILURE_REASON

      return h.view('routes/prn-cancel/result', {
        pageTitle: 'Cancel PRN',
        success: false,
        reason,
        overviewUrl: '/prn-activity',
        ...displayFields
      })
    }
  }
}
