import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/**
 * @typedef {{ id: string, status: string, submissionNumber: number }} Report
 * @typedef {{ year: number, period: number, startDate: string, endDate: string, dueDate: string, report: Report | null }} ReportingPeriod
 * @typedef {{ cadence: string, reportingPeriods: ReportingPeriod[] }} Reports
 * @typedef {{ id: string, accreditationNumber: string, status: string }} Accreditation
 * @typedef {{ id: string, registrationNumber: string, status: string, material: string, accreditation?: Accreditation, reports: Reports }} Registration
 * @typedef {{ id: string, companyName: string, registrations: Registration[] }} OrganisationOverview
 */

export const organisationOverviewGETController = {
  async handler(request, h) {
    const id = request.params.id

    /** @type {OrganisationOverview} */
    const data = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${id}/overview`,
      {}
    )

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/organisation-overview/index', {
      pageTitle,
      heading: data.companyName,
      organisationId: id,
      registrations: data.registrations
    })
  }
}
