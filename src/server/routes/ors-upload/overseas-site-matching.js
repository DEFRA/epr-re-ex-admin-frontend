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
 * service sites on its registration that already hold that number. The
 * registration service holds each number once per registration, so:
 * - free: nothing holds it
 * - clash: a site that is not itself renumbered keeps it, so a person must
 *   decide what that site gets
 * - chain: the site holding it moves to another number first
 * - swap: the sites pass their numbers round, so one needs a spare number
 *   while they move
 * @typedef {'free' | 'clash' | 'chain' | 'swap'} Renumbering
 */

/**
 * A registration service site holding a number a renumbered site needs back,
 * with the re-ex number it is itself renumbered to, if it is.
 * @typedef {{ site: RegistrationServiceSite, movesTo: string | null }} NumberHolder
 */

/**
 * A pair whose numbers differ, with how it takes re-ex's number back and the
 * registration service sites that already hold that number.
 * @typedef {SitePair & {
 *   renumbering: Renumbering,
 *   reExNumberHolders: NumberHolder[]
 * }} RenumberedPair
 */

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
 * Builds each renumbered pair in a registration, with how it takes re-ex's
 * number back, found by following the sites that hold that number.
 *
 * @param {Map<KeyedSite<OverseasSiteRow>, KeyedSite<RegistrationServiceSite>>} renumbered - re-ex site to its partner
 * @param {KeyedSite<RegistrationServiceSite>[]} registrationServiceSites - every site the registration service holds in the registration
 */
const renumberedPairsIn = (renumbered, registrationServiceSites) => {
  /** @type {Map<KeyedSite<RegistrationServiceSite>, KeyedSite<OverseasSiteRow>>} */
  const movingTo = new Map(
    [...renumbered].map(([reExSite, partner]) => [partner, reExSite])
  )

  /** @param {string | null} orsId */
  const holdersOf = (orsId) =>
    orsId === null
      ? []
      : registrationServiceSites.filter(({ key }) => key.orsId === orsId)

  /**
   * @param {KeyedSite<RegistrationServiceSite>} start
   * @param {KeyedSite<RegistrationServiceSite>[]} holders
   * @param {Set<KeyedSite<RegistrationServiceSite>>} seen
   * @returns {boolean}
   */
  const passesBackTo = (start, holders, seen) =>
    holders.some((holder) => {
      if (holder === start) {
        return true
      }
      const next = movingTo.get(holder)
      if (!next || seen.has(holder)) {
        return false
      }
      seen.add(holder)
      return passesBackTo(start, holdersOf(next.key.orsId), seen)
    })

  /**
   * @param {KeyedSite<OverseasSiteRow>} reExSite
   * @param {KeyedSite<RegistrationServiceSite>} partner
   * @returns {Renumbering}
   */
  const renumberingOf = (reExSite, partner) => {
    const holders = holdersOf(reExSite.key.orsId)
    if (!holders.length) {
      return 'free'
    }
    if (holders.some((holder) => !movingTo.has(holder))) {
      return 'clash'
    }
    return passesBackTo(partner, holders, new Set()) ? 'swap' : 'chain'
  }

  /**
   * @param {KeyedSite<OverseasSiteRow>} reExSite
   * @param {KeyedSite<RegistrationServiceSite>} partner
   * @returns {RenumberedPair}
   */
  return (reExSite, partner) => ({
    reEx: reExSite.site,
    registrationService: partner.site,
    renumbering: renumberingOf(reExSite, partner),
    reExNumberHolders: holdersOf(reExSite.key.orsId).map((holder) => ({
      site: holder.site,
      movesTo: movingTo.get(holder)?.key.orsId ?? null
    }))
  })
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

    const renumbered = new Map(
      [...pairs].filter(([r, s]) => r.key.orsId !== s.key.orsId)
    )
    const renumberedPair = renumberedPairsIn(
      renumbered,
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
        numberNeededBy: [...renumbered.keys()]
          .filter(({ key }) => key.orsId !== null && key.orsId === s.key.orsId)
          .map(({ site }) => site)
      })
    }
  }

  return matches
}
