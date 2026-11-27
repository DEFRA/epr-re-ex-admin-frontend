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
 * How a renumbered site can take re-ex's number back, given the registration
 * service site on its registration that already holds that number. The
 * registration service holds each number once per registration, so:
 * - free: nothing holds it
 * - clash: the site holding it is not itself renumbered, so it keeps it and a
 *   person must decide what that site gets
 * - chain: the site holding it moves to another number first
 * - swap: the sites pass their numbers round, so one needs a spare number
 *   while they move
 * - blocked: the sites holding it move in a chain that ends at a site keeping
 *   its number
 * @typedef {{ renumbering: 'free' }
 *   | { renumbering: 'clash', holder: RegistrationServiceSite }
 *   | {
 *       renumbering: 'chain' | 'swap',
 *       holder: RegistrationServiceSite,
 *       holderMovesTo: string
 *     }
 *   | {
 *       renumbering: 'blocked',
 *       keptBy: RegistrationServiceSite,
 *       keptNumber: string
 *     }
 * } NumberReturn
 */

/** @typedef {NumberReturn['renumbering']} Renumbering */

/** @typedef {SitePair & NumberReturn} RenumberedPair */

/**
 * @template S
 * @typedef {{ site: S, nearMatches: NearMatch[] }} UnpairedSite
 */

/**
 * A registration service site left unpaired, with the re-ex sites whose number
 * it keeps. Each of those is a clash.
 * @typedef {UnpairedSite<RegistrationServiceSite> & {
 *   numberNeededBy: OverseasSiteRow[]
 * }} UnpairedRegistrationServiceSite
 */

/**
 * @typedef {{
 *   sameNumber: SitePair[],
 *   differentNumber: RenumberedPair[],
 *   reExOnly: UnpairedSite<OverseasSiteRow>[],
 *   registrationServiceOnly: UnpairedRegistrationServiceSite[]
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
 * A site with no number sorts after the numbered sites.
 *
 * @param {KeyedSite<unknown>} a
 * @param {KeyedSite<unknown>} b
 */
const byOrsId = (a, b) =>
  Number(a.key.orsId === null) - Number(b.key.orsId === null) ||
  (a.key.orsId ?? '').localeCompare(b.key.orsId ?? '')

/**
 * @template {OverseasSiteRow} S
 * @param {S[]} sites
 * @returns {Map<string, KeyedSite<S>[]>}
 */
const byRegistration = (sites) => {
  /** @type {Map<string, KeyedSite<S>[]>} */
  const registrations = new Map()
  for (const site of sites) {
    const registration = registrationOf(site)
    registrations.set(registration, [
      ...(registrations.get(registration) ?? []),
      { site, key: comparable(site) }
    ])
  }
  for (const keyedSites of registrations.values()) {
    keyedSites.sort(byOrsId)
  }
  return registrations
}

/**
 * The re-ex number each registration service number moves to. A site paired
 * with a re-ex site that has no number has nothing to move to, so it keeps its
 * own.
 *
 * @param {Map<KeyedSite<OverseasSiteRow>, KeyedSite<RegistrationServiceSite>>} renumbered - re-ex site to its partner
 * @returns {Map<string | null, string>}
 */
const numberMovesIn = (renumbered) =>
  new Map(
    [...renumbered].flatMap(([reExSite, partner]) =>
      reExSite.key.orsId === null
        ? []
        : [[partner.key.orsId, reExSite.key.orsId]]
    )
  )

/**
 * @callback RenumberedPairBuilder
 * @param {KeyedSite<OverseasSiteRow>} reExSite
 * @param {KeyedSite<RegistrationServiceSite>} partner
 * @returns {RenumberedPair}
 */

/**
 * Builds each renumbered pair in a registration, with how it takes re-ex's
 * number back, found by following the sites that hold each number in turn.
 * The registration service holds each number once per registration, so the
 * sites carrying one number are copies of one site edited between
 * applications, and where one copy moves they all do.
 *
 * @param {Map<KeyedSite<OverseasSiteRow>, KeyedSite<RegistrationServiceSite>>} renumbered - re-ex site to its partner
 * @param {Map<string | null, string>} numberMoves - from numberMovesIn
 * @param {KeyedSite<RegistrationServiceSite>[]} registrationServiceSites - every site the registration service holds in the registration
 * @returns {RenumberedPairBuilder}
 */
const renumberedPairsIn = (
  renumbered,
  numberMoves,
  registrationServiceSites
) => {
  /** @type {Map<string | null, RegistrationServiceSite>} */
  const holders = new Map(
    [...renumbered.values()].map(({ key, site }) => [key.orsId, site])
  )
  for (const { key, site } of registrationServiceSites) {
    if (key.orsId !== null && !holders.has(key.orsId)) {
      holders.set(key.orsId, site)
    }
  }

  /**
   * Follows the sites holding each number from `number` until the numbers run
   * free, come back to `start`, or reach a site that keeps its number. A loop
   * that misses `start` needs re-ex to give two sites one number, and ends the
   * chain.
   *
   * @param {string | null} start
   * @param {string} number
   * @returns {'chain' | 'swap' | { keptBy: RegistrationServiceSite, keptNumber: string }}
   */
  const endOfChain = (start, number) => {
    const seen = new Set()
    let next = number
    while (next !== start) {
      const holder = holders.get(next)
      const onward = numberMoves.get(next)
      if (!holder || seen.has(next)) {
        return 'chain'
      }
      if (onward === undefined) {
        return { keptBy: holder, keptNumber: next }
      }
      seen.add(next)
      next = onward
    }
    return 'swap'
  }

  /**
   * @param {KeyedSite<OverseasSiteRow>} reExSite
   * @param {KeyedSite<RegistrationServiceSite>} partner
   * @returns {NumberReturn}
   */
  const numberReturnOf = (reExSite, partner) => {
    const holder = holders.get(reExSite.key.orsId)
    const holderMovesTo = numberMoves.get(reExSite.key.orsId)
    if (!holder) {
      return { renumbering: 'free' }
    }
    if (holderMovesTo === undefined) {
      return { renumbering: 'clash', holder }
    }
    const end = endOfChain(partner.key.orsId, holderMovesTo)
    return typeof end === 'string'
      ? { renumbering: end, holder, holderMovesTo }
      : { renumbering: 'blocked', ...end }
  }

  return (reExSite, partner) => ({
    reEx: reExSite.site,
    registrationService: partner.site,
    ...numberReturnOf(reExSite, partner)
  })
}

/**
 * Pairs the sites of one registration on their details, first where the
 * numbers agree and then where they differ. A registration service site with
 * no number never pairs.
 *
 * @param {KeyedSite<OverseasSiteRow>[]} reExSites
 * @param {KeyedSite<RegistrationServiceSite>[]} registrationServiceSites
 */
const pairSitesIn = (reExSites, registrationServiceSites) => {
  /** @type {Map<KeyedSite<OverseasSiteRow>, KeyedSite<RegistrationServiceSite>>} */
  const pairs = new Map()
  const unpaired = new Set(
    registrationServiceSites.filter(({ key }) => key.orsId !== null)
  )
  /** @param {boolean} keepsNumber */
  const pairWhere = (keepsNumber) => {
    for (const r of reExSites.filter((site) => !pairs.has(site))) {
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
  return pairs
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

    const pairs = pairSitesIn(reExSites, registrationServiceSites)
    const unpairedReExSites = () => reExSites.filter((site) => !pairs.has(site))

    const renumbered = new Map(
      [...pairs].filter(([r, s]) => r.key.orsId !== s.key.orsId)
    )
    const numberMoves = numberMovesIn(renumbered)
    const renumberedPair = renumberedPairsIn(
      renumbered,
      numberMoves,
      registrationServiceSites
    )
    for (const [r, s] of pairs) {
      if (renumbered.has(r)) {
        matches.differentNumber.push(renumberedPair(r, s))
      } else {
        matches.sameNumber.push({ reEx: r.site, registrationService: s.site })
      }
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
        nearMatches: nearMatchesOf(s.key, reExKeys),
        numberNeededBy: numberMoves.has(s.key.orsId)
          ? []
          : [...renumbered.keys()]
              .filter(
                ({ key }) => key.orsId !== null && key.orsId === s.key.orsId
              )
              .map(({ site }) => site)
      })
    }
  }

  return matches
}
