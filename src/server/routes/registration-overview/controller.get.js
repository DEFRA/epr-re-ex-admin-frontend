import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'

const GREEN_TAG = 'govuk-tag--green'
const RED_TAG = 'govuk-tag--red'

const STATUS_DISPLAY = {
  submitted: { label: 'Success', className: GREEN_TAG },
  rejected: { label: 'Failed (Rejected)', className: RED_TAG },
  invalid: { label: 'Failed (Invalid)', className: RED_TAG },
  validation_failed: { label: 'Failed (Validation)', className: RED_TAG },
  submission_failed: { label: 'Failed (Submission)', className: RED_TAG }
}

const toSummaryLogTableRow =
  (organisationId, registrationId) => (summaryLog) => {
    const { summaryLogId, uploadedAt, status } = summaryLog

    const { label, className } = STATUS_DISPLAY[status]

    const downloadUrl = `/system-logs/download/${organisationId}/${registrationId}/${summaryLogId}`

    return [
      { text: uploadedAt },
      { html: `<strong class="govuk-tag ${className}">${label}</strong>` },
      {
        html: `<a class="govuk-link govuk-link--no-visited-state" href="${downloadUrl}">Download</a>`
      }
    ]
  }

const fetchWasteBalance = async (request, organisationId, accreditationId) => {
  try {
    const balanceMap = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}/waste-balances?accreditationIds=${accreditationId}`,
      {}
    )
    return balanceMap[accreditationId] ?? null
  } catch (err) {
    request.logger.warn({ message: 'Failed to fetch waste balance', err })
    return null
  }
}

export const registrationOverviewGETController = {
  async handler(request, h) {
    const { organisationId, registrationId } = request.params

    const [overview, calendar, { summaryLogs }] = await Promise.all([
      fetchOrganisationOverview(request, organisationId),
      fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar`,
        {}
      ),
      fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs`,
        {}
      )
    ])

    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    const wasteBalance = registration.accreditation
      ? await fetchWasteBalance(
          request,
          organisationId,
          registration.accreditation.id
        )
      : null

    const pageTitle = request.route.settings.app.pageTitle

    const heading = `${overview.companyName} - ${registration.registrationNumber ?? registration.id}`

    const summaryLogRows = summaryLogs.map(
      toSummaryLogTableRow(organisationId, registrationId)
    )

    return h.view('routes/registration-overview/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        }
      ],
      pageTitle,
      heading,
      organisationId,
      registrationId,
      registration,
      cadence: calendar.cadence,
      reportingPeriods: calendar.reportingPeriods.map((rp) => ({
        ...rp,
        formattedPeriod: formatPeriod(rp.period, calendar.cadence)
      })),
      summaryLogRows,
      wasteBalance,
      wasteBalanceEventsUrl: registration.accreditation
        ? `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${registration.accreditation.id}/waste-balance-events`
        : null
    })
  }
}
