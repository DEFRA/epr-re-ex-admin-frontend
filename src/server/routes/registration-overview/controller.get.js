import {
  fetchOrganisationView,
  processingTypeOf,
  registrationIn,
  siteOf
} from '#server/common/helpers/fetch-organisation-view.js'
import {
  organisationOverviewUrl,
  yearPageUrls
} from '#server/common/helpers/page-urls.js'
import { registrationYears } from '#server/common/helpers/registration-years.js'

/**
 * @import { RegistrationKeys } from '#server/common/helpers/natural-keys/swap-keys.js'
 */

export const registrationOverviewGETController = {
  async handler(request, h) {
    const { organisationNumber, registrationNumber } = request.params
    /** @type {RegistrationKeys} */
    const registrationKeys = { organisationNumber, registrationNumber }

    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const organisation = await fetchOrganisationView(
      request,
      organisationNumber
    )
    const registration = registrationIn(organisation, registrationNumber)

    const yearRows = registrationYears(registration).map((details) => ({
      ...details,
      viewUrl: yearPageUrls[details.kind]({
        ...registrationKeys,
        year: details.year
      })
    }))

    return h.view('routes/registration-overview/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: organisationOverviewUrl({ organisationNumber })
        }
      ],
      pageTitle: request.route.settings.app.pageTitle,
      heading: `${organisation.name} - ${registrationNumber}`,
      registration: {
        processingType: processingTypeOf(registration),
        material: registration.material,
        site: siteOf(registration)
      },
      yearRows,
      error: errorMessage
    })
  }
}
