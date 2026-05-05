import Boom from '@hapi/boom'
import { config } from '#config/config.js'
import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'
import { FEATURE_FLAG_KEY, SESSION_KEY } from './constants.js'
import { formatPeriod } from './helpers.js'

export const reportUnsubmitResultGetController = {
  async handler(request, h) {
    if (!config.get(FEATURE_FLAG_KEY)) {
      throw Boom.notFound()
    }

    const { organisationId, registrationId, year, cadence, period } =
      request.params

    const result = request.yar.get(SESSION_KEY)

    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    if (!result) {
      return h.redirect(overviewUrl)
    }

    request.yar.clear(SESSION_KEY)

    const overview = await fetchOrganisationOverview(request, organisationId)
    const registration = overview.registrations.find(
      (r) => r.id === registrationId
    )

    return h.view('routes/report-unsubmit/result', {
      pageTitle: request.route.settings.app.pageTitle,
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        { text: 'Reports', href: overviewUrl }
      ],
      success: result.success,
      errorMessage: result.message,
      overviewUrl,
      registrationNumber: registration?.registrationNumber ?? registrationId,
      formattedPeriod: formatPeriod(period, cadence),
      year
    })
  }
}
