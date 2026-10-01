import { PAGE_TITLE } from './constants.js'

/**
 * Renders the confirmation page from the display values carried on the query
 * string by the Cancel link in `/prn-activity` — there is no backend
 * single-PRN admin GET endpoint to re-fetch them from. This is display only:
 * the backend independently re-checks the PRN's status and cancellation
 * window on POST, so a tampered query string cannot cause a bad cancellation.
 */
export const prnCancelConfirmGetController = {
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
    } = request.query

    return h.view('routes/prn-cancel/confirm', {
      pageTitle: request.route.settings.app?.pageTitle,
      heading: PAGE_TITLE,
      breadcrumbs: [{ text: 'PRN activity', href: '/prn-activity' }],
      overviewUrl: '/prn-activity',
      postUrl: `/prn-activity/${prnId}/cancel`,
      prnNumber,
      organisationName,
      issuedTo,
      tonnage,
      material,
      accreditationNumber,
      accreditationYear
    })
  }
}
