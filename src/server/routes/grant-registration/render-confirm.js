import { PAGE_TITLE } from './constants.js'

/**
 * Build and return the "Approve registration" confirm view.
 *
 * @param {import('@hapi/hapi').ResponseToolkit} h - Hapi response toolkit
 * @param {{ organisationId: string, registrationId: string, overviewUrl: string, registrationNumber: string, version: number, reason: string, reasonError: object | null, errors: Array<{text: string, href?: string}> | null }} options
 * @returns {import('@hapi/hapi').ResponseObject}
 */
export const renderConfirm = (
  h,
  {
    organisationId,
    registrationId,
    overviewUrl,
    registrationNumber,
    version,
    reason,
    reasonError,
    errors
  }
) => {
  return h.view('routes/grant-registration/confirm', {
    pageTitle: PAGE_TITLE,
    heading: PAGE_TITLE,
    breadcrumbs: [
      { text: 'Organisations', href: '/organisations' },
      {
        text: 'Organisation overview',
        href: `/organisations/${organisationId}/overview`
      },
      { text: 'Registration overview', href: overviewUrl }
    ],
    overviewUrl,
    postUrl: `/organisations/${organisationId}/registrations/${registrationId}/approve`,
    registrationNumber,
    version,
    reason,
    reasonError,
    errors
  })
}
