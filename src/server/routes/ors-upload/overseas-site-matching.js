/**
 * @import { OverseasSiteRow } from './overseas-sites-csv.js'
 * @import { RegistrationServiceSiteRow } from './controller.registration-service-download.js'
 */

/**
 * @typedef {{
 *   year: number,
 *   applicationReference: string | null,
 *   applicationStatus: string,
 *   accreditationNumber: string | null,
 *   siteId: number,
 *   selected: boolean
 * }} SiteApplication
 */

/**
 * One site the registration service holds under a registration, with every
 * application it appears on.
 * @typedef {Omit<RegistrationServiceSiteRow, keyof SiteApplication> & {
 *   applications: SiteApplication[]
 * }} RegistrationServiceSite
 */

/**
 * @typedef {'sameDetails' | 'sameNumber' | 'sameName' | 'sameAddressLine1'} NearMatchReason
 */

/**
 * A site on the other side that a person should compare with an unpaired one.
 * @typedef {{
 *   reason: NearMatchReason,
 *   orsId: string | null,
 *   overseasReprocessorName: OverseasSiteRow['overseasReprocessorName'],
 *   addressLine1: OverseasSiteRow['addressLine1']
 * }} NearMatch
 */

/**
 * @typedef {{ reEx: OverseasSiteRow, registrationService: RegistrationServiceSite }} SitePair
 */

/**
 * @template S
 * @typedef {{ site: S, nearMatches: NearMatch[] }} UnpairedSite
 */

/**
 * @typedef {{
 *   sameNumber: SitePair[],
 *   differentNumber: SitePair[],
 *   reExOnly: UnpairedSite<OverseasSiteRow>[],
 *   registrationServiceOnly: UnpairedSite<RegistrationServiceSite>[]
 * }} OverseasSiteMatches
 */

/**
 * @typedef {{
 *   orsId: string | null,
 *   overseasReprocessorName: OverseasSiteRow['overseasReprocessorName'],
 *   addressLine1: OverseasSiteRow['addressLine1'],
 *   nameKey: string,
 *   line1Key: string,
 *   detailsKey: string | null
 * }} Comparable
 */

/**
 * @template S
 * @typedef {{ site: S, key: Comparable }} KeyedSite
 */

/** @param {string | null | undefined} value */
const normalise = (value) =>
  (value ?? '').toLowerCase().replaceAll(/[^\p{L}\p{N}]+/gu, '')

/**
 * The details two sites must share to be the same site. The registration
 * service holds no postcode, so the postcode is not one of them. A site with
 * neither a name nor an address line 1 has no details to share.
 *
 * @param {OverseasSiteRow} site
 * @returns {Comparable}
 */
const comparable = (site) => {
  const nameKey = normalise(site.overseasReprocessorName)
  const line1Key = normalise(site.addressLine1)
  return {
    orsId: site.orsId ?? null,
    overseasReprocessorName: site.overseasReprocessorName,
    addressLine1: site.addressLine1,
    nameKey,
    line1Key,
    detailsKey:
      nameKey || line1Key
        ? [normalise(site.destinationCountry), nameKey, line1Key].join('|')
        : null
  }
}

/** @type {[NearMatchReason, (a: Comparable, b: Comparable) => boolean][]} */
const nearMatchTests = [
  [
    'sameDetails',
    (a, b) => a.detailsKey !== null && a.detailsKey === b.detailsKey
  ],
  ['sameNumber', (a, b) => a.orsId !== null && a.orsId === b.orsId],
  ['sameName', (a, b) => a.nameKey !== '' && a.nameKey === b.nameKey],
  ['sameAddressLine1', (a, b) => a.line1Key !== '' && a.line1Key === b.line1Key]
]

/**
 * Each site on the other side that shares something with this one, under the
 * strongest reason it shares.
 *
 * @param {Comparable} site
 * @param {Comparable[]} others
 * @returns {NearMatch[]}
 */
const nearMatchesOf = (site, others) =>
  others.flatMap((other) => {
    const found = nearMatchTests.find(([, test]) => test(site, other))
    return found
      ? [
          {
            reason: found[0],
            orsId: other.orsId,
            overseasReprocessorName: other.overseasReprocessorName,
            addressLine1: other.addressLine1
          }
        ]
      : []
  })

/** @param {OverseasSiteRow} site */
const registrationOf = (site) => `${site.orgId}|${site.registrationNumber}`

/**
 * A site that keeps its number and details from one application to the next
 * is one site.
 *
 * @param {RegistrationServiceSiteRow[]} rows
 * @returns {RegistrationServiceSite[]}
 */
const collapseApplications = (rows) => {
  /** @type {Map<string, RegistrationServiceSite>} */
  const sites = new Map()
  for (const row of rows) {
    const {
      year,
      applicationReference,
      applicationStatus,
      accreditationNumber,
      siteId,
      selected,
      ...site
    } = row
    const key = `${registrationOf(row)}#${row.orsId}#${comparable(row).detailsKey}`
    const collapsed = sites.get(key) ?? { ...site, applications: [] }
    collapsed.applications.push({
      year,
      applicationReference,
      applicationStatus,
      accreditationNumber: accreditationNumber ?? null,
      siteId,
      selected
    })
    sites.set(key, collapsed)
  }
  return [...sites.values()]
}

/**
 * A site with no number sorts after its registration's numbered sites.
 *
 * @template {OverseasSiteRow} S
 * @param {S} a
 * @param {S} b
 */
const byRegistrationThenOrsId = (a, b) =>
  `${a.registrationNumber} ${a.orsId}`.localeCompare(
    `${b.registrationNumber} ${b.orsId}`
  )

/**
 * @template {OverseasSiteRow} S
 * @param {S[]} sites
 * @returns {Map<string, KeyedSite<S>[]>}
 */
const byRegistration = (sites) => {
  /** @type {Map<string, KeyedSite<S>[]>} */
  const registrations = new Map()
  for (const site of [...sites].sort(byRegistrationThenOrsId)) {
    const registration = registrationOf(site)
    registrations.set(registration, [
      ...(registrations.get(registration) ?? []),
      { site, key: comparable(site) }
    ])
  }
  return registrations
}

/**
 * Matches re-ex's overseas sites to the registration service's within each
 * registration, where the registration service's numbers are unique. Sites
 * pair only when their details are the same, keeping the number where they
 * can, and a registration service site with no number never pairs. Every site
 * left unpaired lists the sites on the other side a person should compare it
 * with.
 *
 * @param {OverseasSiteRow[]} reExRows
 * @param {RegistrationServiceSiteRow[]} registrationServiceRows - one row per site on each application
 * @returns {OverseasSiteMatches}
 */
export const matchOverseasSites = (reExRows, registrationServiceRows) => {
  const reEx = byRegistration(reExRows)
  const registrationService = byRegistration(
    collapseApplications(registrationServiceRows)
  )

  /** @type {OverseasSiteMatches} */
  const matches = {
    sameNumber: [],
    differentNumber: [],
    reExOnly: [],
    registrationServiceOnly: []
  }

  const registrations = [
    ...new Set([...reEx.keys(), ...registrationService.keys()])
  ].sort((a, b) => a.localeCompare(b))
  for (const registration of registrations) {
    const reExSites = reEx.get(registration) ?? []
    const registrationServiceSites = registrationService.get(registration) ?? []

    /** @type {Map<typeof reExSites[number], typeof registrationServiceSites[number]>} */
    const pairs = new Map()
    const unpairedReExSites = () => reExSites.filter((site) => !pairs.has(site))
    const unpaired = new Set(
      registrationServiceSites.filter(({ key }) => key.orsId !== null)
    )
    /** @param {boolean} keepsNumber */
    const pairWhere = (keepsNumber) => {
      for (const r of unpairedReExSites()) {
        const partner = [...unpaired].find(
          ({ key }) =>
            r.key.detailsKey !== null &&
            key.detailsKey === r.key.detailsKey &&
            (key.orsId === r.key.orsId) === keepsNumber
        )
        if (partner) {
          pairs.set(r, partner)
          unpaired.delete(partner)
        }
      }
    }
    pairWhere(true)
    pairWhere(false)

    for (const [r, s] of pairs) {
      const group =
        r.key.orsId === s.key.orsId
          ? matches.sameNumber
          : matches.differentNumber
      group.push({ reEx: r.site, registrationService: s.site })
    }

    const pairedRegistrationService = new Set(pairs.values())
    const reExKeys = reExSites.map(({ key }) => key)
    const registrationServiceKeys = registrationServiceSites.map(
      ({ key }) => key
    )
    for (const r of unpairedReExSites()) {
      matches.reExOnly.push({
        site: r.site,
        nearMatches: nearMatchesOf(r.key, registrationServiceKeys)
      })
    }
    for (const s of registrationServiceSites.filter(
      (site) => !pairedRegistrationService.has(site)
    )) {
      matches.registrationServiceOnly.push({
        site: s.site,
        nearMatches: nearMatchesOf(s.key, reExKeys)
      })
    }
  }

  return matches
}
