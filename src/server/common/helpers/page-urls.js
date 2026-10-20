/**
 * Admin pages addressed by natural keys. The organisation and registration
 * overviews are still served by id, so these addresses redirect there.
 */

/**
 * @param {{ organisationNumber: string }} keys
 */
export const organisationOverviewUrl = ({ organisationNumber }) =>
  `/organisations/${organisationNumber}/overview`

/**
 * @param {{ organisationNumber: string, registrationNumber: string }} keys
 */
export const registrationOverviewUrl = ({
  organisationNumber,
  registrationNumber
}) =>
  `/organisations/${organisationNumber}/registrations/${registrationNumber}/overview`

/**
 * The breadcrumbs of a page under a registration.
 * @param {{ organisationNumber: string, registrationNumber: string }} keys
 */
export const registrationBreadcrumbs = (keys) => [
  { text: 'Organisations', href: '/organisations' },
  { text: 'Organisation overview', href: organisationOverviewUrl(keys) },
  { text: 'Registration overview', href: registrationOverviewUrl(keys) }
]
