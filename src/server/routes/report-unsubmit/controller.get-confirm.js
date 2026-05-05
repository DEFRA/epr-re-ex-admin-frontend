import Boom from '@hapi/boom'
import { config } from '#config/config.js'
import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'
import { FEATURE_FLAG_KEY, PAGE_TITLE } from './constants.js'
import { formatPeriod } from './helpers.js'

export const reportUnsubmitConfirmGetController = {
  async handler(request, h) {
    if (!config.get(FEATURE_FLAG_KEY)) {
      throw Boom.notFound()
    }

    const { organisationId, registrationId, year, cadence, period } =
      request.params

    const overview = await fetchOrganisationOverview(request, organisationId)
    const registration = overview.registrations.find(
      (r) => r.id === registrationId
    )

    return h.view('routes/report-unsubmit/confirm', {
      pageTitle: request.route.settings.app.pageTitle,
      heading: PAGE_TITLE,
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        {
          text: 'Reports',
          href: `/organisations/${organisationId}/registrations/${registrationId}/overview`
        }
      ],
      overviewUrl: `/organisations/${organisationId}/registrations/${registrationId}/overview`,
      postUrl: `/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/unsubmit`,
      registrationNumber: registration?.registrationNumber ?? registrationId,
      formattedPeriod: formatPeriod(period, cadence),
      year
    })
  }
}
