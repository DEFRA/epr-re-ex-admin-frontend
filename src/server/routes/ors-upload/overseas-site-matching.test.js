import { matchOverseasSites } from './overseas-site-matching.js'

/**
 * @import { OverseasSiteRow } from './overseas-sites-csv.js'
 * @import { RegistrationServiceSiteRow } from './controller.registration-service-download.js'
 */

/**
 * @param {Partial<OverseasSiteRow>} [overrides]
 * @returns {OverseasSiteRow}
 */
const reExSite = (overrides = {}) => ({
  orgId: 500049,
  registrationNumber: 'R26ER5000490001ST',
  accreditationNumber: 'A26ER5000490001ST',
  orsId: '001',
  packagingWasteCategory: 'steel',
  destinationCountry: 'India',
  overseasReprocessorName: 'Bengal Steelworks',
  addressLine1: '12 Mill Road',
  addressLine2: null,
  cityOrTown: 'Kolkata',
  stateProvinceOrRegion: null,
  postcode: '700001',
  coordinates: null,
  validFrom: '2026-01-01',
  ...overrides
})

/**
 * @param {Partial<RegistrationServiceSiteRow>} [overrides]
 * @returns {RegistrationServiceSiteRow}
 */
const registrationServiceSite = (overrides = {}) => ({
  orgId: 500049,
  registrationNumber: 'R26ER5000490001ST',
  packagingWasteCategory: 'steel',
  year: 2027,
  applicationReference: 'APP-1',
  applicationStatus: 'Approved',
  accreditationNumber: 'A27ER5000490001ST',
  siteId: 1,
  orsId: '001',
  selected: true,
  overseasReprocessorName: 'Bengal Steelworks',
  formattedAddress: '12 Mill Road, Kolkata, India',
  destinationCountry: 'India',
  addressLine1: '12 Mill Road',
  addressLine2: null,
  cityOrTown: 'Kolkata',
  coordinates: null,
  ...overrides
})

const indusRecycling = {
  overseasReprocessorName: 'Indus Recycling',
  addressLine1: '4 Port Lane',
  cityOrTown: 'Mumbai'
}

describe('matchOverseasSites', () => {
  test('Should pair sites whose details and number are the same', () => {
    const matches = matchOverseasSites(
      [reExSite()],
      [registrationServiceSite()]
    )

    expect(matches).toEqual({
      sameNumber: [
        {
          reEx: reExSite(),
          registrationService: {
            orgId: 500049,
            registrationNumber: 'R26ER5000490001ST',
            packagingWasteCategory: 'steel',
            orsId: '001',
            overseasReprocessorName: 'Bengal Steelworks',
            formattedAddress: '12 Mill Road, Kolkata, India',
            destinationCountry: 'India',
            addressLine1: '12 Mill Road',
            addressLine2: null,
            cityOrTown: 'Kolkata',
            coordinates: null,
            applications: [
              {
                year: 2027,
                applicationReference: 'APP-1',
                applicationStatus: 'Approved',
                accreditationNumber: 'A27ER5000490001ST',
                siteId: 1,
                selected: true
              }
            ]
          }
        }
      ],
      differentNumber: [],
      reExOnly: [],
      registrationServiceOnly: []
    })
  })

  test('Should ignore case, whitespace, punctuation and the postcode', () => {
    const matches = matchOverseasSites(
      [reExSite()],
      [
        registrationServiceSite({
          overseasReprocessorName: '  BENGAL   steelworks. ',
          destinationCountry: 'india',
          addressLine1: '12,  Mill-Road',
          cityOrTown: null
        })
      ]
    )

    expect(matches.sameNumber).toHaveLength(1)
  })

  test('Should ignore punctuation within a word', () => {
    const matches = matchOverseasSites(
      [reExSite({ overseasReprocessorName: "O'Neill Recycling" })],
      [registrationServiceSite({ overseasReprocessorName: 'ONeill Recycling' })]
    )

    expect(matches.sameNumber).toHaveLength(1)
  })

  test('Should never pair or flag sites on details that have neither a name nor an address line 1', () => {
    const noDetails = { overseasReprocessorName: null, addressLine1: null }
    const matches = matchOverseasSites(
      [reExSite({ orsId: '001', ...noDetails })],
      [registrationServiceSite({ orsId: '002', ...noDetails })]
    )

    expect(matches.differentNumber).toEqual([])
    expect(matches.reExOnly).toEqual([
      { site: expect.objectContaining({ orsId: '001' }), nearMatches: [] }
    ])
  })

  test('Should pair a site the registration service renumbered, such as one whose number was dropped after re-accreditation opened', () => {
    const matches = matchOverseasSites(
      [reExSite({ orsId: '001' })],
      [registrationServiceSite({ orsId: '004' })]
    )

    expect(matches.differentNumber).toEqual([
      {
        reEx: expect.objectContaining({ orsId: '001' }),
        registrationService: expect.objectContaining({ orsId: '004' }),
        renumbering: 'free',
        reExNumberHolders: []
      }
    ])
    expect(matches.reExOnly).toEqual([])
    expect(matches.registrationServiceOnly).toEqual([])
  })

  test('Should flag a clash when a registration service only site keeps the number a renumbered site needs back, such as one added after the numbering bug', () => {
    const matches = matchOverseasSites(
      [reExSite({ orsId: '001' })],
      [
        registrationServiceSite({ orsId: '004' }),
        registrationServiceSite({ orsId: '001', ...indusRecycling })
      ]
    )

    expect(matches.differentNumber).toEqual([
      {
        reEx: expect.objectContaining({ orsId: '001' }),
        registrationService: expect.objectContaining({ orsId: '004' }),
        renumbering: 'clash',
        reExNumberHolders: [
          {
            site: expect.objectContaining({
              orsId: '001',
              overseasReprocessorName: 'Indus Recycling'
            }),
            movesTo: null
          }
        ]
      }
    ])
    expect(matches.registrationServiceOnly).toEqual([
      {
        site: expect.objectContaining({ orsId: '001' }),
        nearMatches: expect.any(Array),
        numberNeededBy: [
          expect.objectContaining({
            orsId: '001',
            overseasReprocessorName: 'Bengal Steelworks'
          })
        ]
      }
    ])
  })

  test('Should mark a chain when the site holding the number is itself renumbered to a free number', () => {
    const matches = matchOverseasSites(
      [
        reExSite({ orsId: '001' }),
        reExSite({ orsId: '002', ...indusRecycling })
      ],
      [
        registrationServiceSite({ orsId: '003' }),
        registrationServiceSite({ orsId: '001', ...indusRecycling })
      ]
    )

    expect(
      matches.differentNumber.map(
        ({ reEx, renumbering, reExNumberHolders }) => ({
          target: reEx.orsId,
          renumbering,
          holders: reExNumberHolders.map(({ site, movesTo }) => [
            site.orsId,
            movesTo
          ])
        })
      )
    ).toEqual([
      { target: '001', renumbering: 'chain', holders: [['001', '002']] },
      { target: '002', renumbering: 'free', holders: [] }
    ])
    expect(matches.registrationServiceOnly).toEqual([])
  })

  test('Should mark a swap when two sites trade numbers', () => {
    const matches = matchOverseasSites(
      [
        reExSite({ orsId: '001' }),
        reExSite({ orsId: '002', ...indusRecycling })
      ],
      [
        registrationServiceSite({ orsId: '002' }),
        registrationServiceSite({ orsId: '001', ...indusRecycling })
      ]
    )

    expect(
      matches.differentNumber.map(
        ({ reEx, renumbering, reExNumberHolders }) => ({
          target: reEx.orsId,
          renumbering,
          holders: reExNumberHolders.map(({ site, movesTo }) => [
            site.orsId,
            movesTo
          ])
        })
      )
    ).toEqual([
      { target: '001', renumbering: 'swap', holders: [['001', '002']] },
      { target: '002', renumbering: 'swap', holders: [['002', '001']] }
    ])
  })

  test('Should mark a swap when three sites pass their numbers round', () => {
    const gangesMetals = {
      overseasReprocessorName: 'Ganges Metals',
      addressLine1: '3 River Street'
    }
    const matches = matchOverseasSites(
      [
        reExSite({ orsId: '001' }),
        reExSite({ orsId: '002', ...indusRecycling }),
        reExSite({ orsId: '003', ...gangesMetals })
      ],
      [
        registrationServiceSite({ orsId: '002' }),
        registrationServiceSite({ orsId: '003', ...indusRecycling }),
        registrationServiceSite({ orsId: '001', ...gangesMetals })
      ]
    )

    expect(
      matches.differentNumber.map(({ renumbering }) => renumbering)
    ).toEqual(['swap', 'swap', 'swap'])
  })

  test('Should mark a chain that runs into a swap between two other sites as a chain, which only re-ex giving two sites one number can make', () => {
    const gangesMetals = {
      overseasReprocessorName: 'Ganges Metals',
      addressLine1: '3 River Street'
    }
    const matches = matchOverseasSites(
      [
        reExSite({ orsId: '001' }),
        reExSite({ orsId: '002', ...indusRecycling }),
        reExSite({ orsId: '001', ...gangesMetals })
      ],
      [
        registrationServiceSite({ orsId: '009' }),
        registrationServiceSite({ orsId: '001', ...indusRecycling }),
        registrationServiceSite({ orsId: '002', ...gangesMetals })
      ]
    )

    expect(
      matches.differentNumber.map(({ reEx, renumbering }) => [
        reEx.overseasReprocessorName,
        renumbering
      ])
    ).toEqual([
      ['Bengal Steelworks', 'chain'],
      ['Ganges Metals', 'swap'],
      ['Indus Recycling', 'swap']
    ])
  })

  test('Should mark a chain that ends at a clash as a chain, and the end of it as the clash', () => {
    const matches = matchOverseasSites(
      [
        reExSite({ orsId: '001' }),
        reExSite({ orsId: '002', ...indusRecycling })
      ],
      [
        registrationServiceSite({ orsId: '005' }),
        registrationServiceSite({ orsId: '001', ...indusRecycling }),
        registrationServiceSite({
          orsId: '002',
          overseasReprocessorName: 'Volga Fibres',
          addressLine1: '5 Quay Road'
        })
      ]
    )

    expect(
      matches.differentNumber.map(({ reEx, renumbering }) => [
        reEx.orsId,
        renumbering
      ])
    ).toEqual([
      ['001', 'chain'],
      ['002', 'clash']
    ])
  })

  test('Should flag a clash when one of several sites holding the number keeps it', () => {
    const matches = matchOverseasSites(
      [
        reExSite({ orsId: '001' }),
        reExSite({ orsId: '002', ...indusRecycling })
      ],
      [
        registrationServiceSite({ orsId: '003' }),
        registrationServiceSite({ orsId: '001', ...indusRecycling }),
        registrationServiceSite({
          orsId: '001',
          overseasReprocessorName: 'Volga Fibres',
          addressLine1: '5 Quay Road'
        })
      ]
    )

    expect(matches.differentNumber[0]).toEqual(
      expect.objectContaining({
        renumbering: 'clash',
        reExNumberHolders: [
          {
            site: expect.objectContaining({
              overseasReprocessorName: 'Indus Recycling'
            }),
            movesTo: '002'
          },
          {
            site: expect.objectContaining({
              overseasReprocessorName: 'Volga Fibres'
            }),
            movesTo: null
          }
        ]
      })
    )
  })

  test('Should find nothing holding the number of a re-ex site that has none, even a registration service site with no number', () => {
    const matches = matchOverseasSites(
      [reExSite({ orsId: null })],
      [
        registrationServiceSite({ orsId: '004' }),
        registrationServiceSite({ orsId: null, ...indusRecycling })
      ]
    )

    expect(matches.differentNumber).toEqual([
      expect.objectContaining({ renumbering: 'free', reExNumberHolders: [] })
    ])
    expect(matches.registrationServiceOnly).toEqual([
      expect.objectContaining({ numberNeededBy: [] })
    ])
  })

  test('Should prefer the pairing that keeps the number when two sites share the details', () => {
    const matches = matchOverseasSites(
      [reExSite({ orsId: '002' })],
      [
        registrationServiceSite({ siteId: 1, orsId: '005' }),
        registrationServiceSite({ siteId: 2, orsId: '002' })
      ]
    )

    expect(matches.sameNumber).toHaveLength(1)
    expect(matches.differentNumber).toEqual([])
    expect(matches.registrationServiceOnly).toEqual([
      {
        site: expect.objectContaining({ orsId: '005' }),
        nearMatches: [
          {
            reason: 'sameDetails',
            orsId: '002',
            overseasReprocessorName: 'Bengal Steelworks',
            addressLine1: '12 Mill Road'
          }
        ],
        numberNeededBy: []
      }
    ])
  })

  test('Should collapse the same site on several applications into one', () => {
    const matches = matchOverseasSites(
      [reExSite()],
      [
        registrationServiceSite({ siteId: 1, year: 2027 }),
        registrationServiceSite({
          siteId: 7,
          year: 2028,
          applicationReference: null,
          applicationStatus: 'Started',
          accreditationNumber: null
        })
      ]
    )

    expect(matches.sameNumber).toHaveLength(1)
    expect(matches.sameNumber[0].registrationService.applications).toEqual([
      expect.objectContaining({ year: 2027, siteId: 1 }),
      {
        year: 2028,
        applicationReference: null,
        applicationStatus: 'Started',
        accreditationNumber: null,
        siteId: 7,
        selected: true
      }
    ])
  })

  test('Should keep apart the same site held under two registrations', () => {
    const otherRegistration = {
      orgId: 500031,
      registrationNumber: 'R26ER5000310001AL'
    }
    const matches = matchOverseasSites(
      [reExSite(), reExSite(otherRegistration)],
      [registrationServiceSite(), registrationServiceSite(otherRegistration)]
    )

    expect(
      matches.sameNumber.map(
        ({ registrationService }) => registrationService.registrationNumber
      )
    ).toEqual(['R26ER5000310001AL', 'R26ER5000490001ST'])
  })

  test('Should keep apart two versions of a site when the operator edited its details on one application', () => {
    const matches = matchOverseasSites(
      [reExSite()],
      [
        registrationServiceSite({ year: 2027 }),
        registrationServiceSite({
          year: 2028,
          overseasReprocessorName: 'Bengal Steel Works Ltd'
        })
      ]
    )

    expect(matches.sameNumber).toHaveLength(1)
    expect(matches.registrationServiceOnly).toEqual([
      {
        site: expect.objectContaining({
          orsId: '001',
          overseasReprocessorName: 'Bengal Steel Works Ltd'
        }),
        nearMatches: [
          {
            reason: 'sameNumber',
            orsId: '001',
            overseasReprocessorName: 'Bengal Steelworks',
            addressLine1: '12 Mill Road'
          }
        ],
        numberNeededBy: []
      }
    ])
  })

  test('Should never pair on the number alone, such as an operator-added site that took a number re-ex had given another site', () => {
    const matches = matchOverseasSites(
      [reExSite({ orsId: '003' })],
      [registrationServiceSite({ orsId: '003', ...indusRecycling })]
    )

    expect(matches.sameNumber).toEqual([])
    expect(matches.reExOnly).toEqual([
      {
        site: expect.objectContaining({ orsId: '003' }),
        nearMatches: [
          {
            reason: 'sameNumber',
            orsId: '003',
            overseasReprocessorName: 'Indus Recycling',
            addressLine1: '4 Port Lane'
          }
        ]
      }
    ])
    expect(matches.registrationServiceOnly).toEqual([
      {
        site: expect.objectContaining({ orsId: '003' }),
        nearMatches: [
          {
            reason: 'sameNumber',
            orsId: '003',
            overseasReprocessorName: 'Bengal Steelworks',
            addressLine1: '12 Mill Road'
          }
        ],
        numberNeededBy: []
      }
    ])
  })

  test('Should leave a registration service site with no number unpaired, flagged against the site with the same details', () => {
    const matches = matchOverseasSites(
      [reExSite()],
      [registrationServiceSite({ orsId: null })]
    )

    expect(matches.sameNumber).toEqual([])
    expect(matches.differentNumber).toEqual([])
    expect(matches.reExOnly).toEqual([
      {
        site: expect.objectContaining({ orsId: '001' }),
        nearMatches: [
          {
            reason: 'sameDetails',
            orsId: null,
            overseasReprocessorName: 'Bengal Steelworks',
            addressLine1: '12 Mill Road'
          }
        ]
      }
    ])
    expect(matches.registrationServiceOnly).toEqual([
      {
        site: expect.objectContaining({ orsId: null }),
        nearMatches: [
          {
            reason: 'sameDetails',
            orsId: '001',
            overseasReprocessorName: 'Bengal Steelworks',
            addressLine1: '12 Mill Road'
          }
        ],
        numberNeededBy: []
      }
    ])
  })

  test('Should flag a site whose name or first address line alone was kept for a person', () => {
    const matches = matchOverseasSites(
      [
        reExSite({ orsId: '001' }),
        reExSite({ orsId: '002', ...indusRecycling })
      ],
      [
        registrationServiceSite({
          orsId: '007',
          overseasReprocessorName: 'Bengal Steelworks 2'
        }),
        registrationServiceSite({
          orsId: '008',
          ...indusRecycling,
          addressLine1: '4 Port Lane East'
        })
      ]
    )

    expect(matches.reExOnly).toEqual([
      {
        site: expect.objectContaining({ orsId: '001' }),
        nearMatches: [
          {
            reason: 'sameAddressLine1',
            orsId: '007',
            overseasReprocessorName: 'Bengal Steelworks 2',
            addressLine1: '12 Mill Road'
          }
        ]
      },
      {
        site: expect.objectContaining({ orsId: '002' }),
        nearMatches: [
          {
            reason: 'sameName',
            orsId: '008',
            overseasReprocessorName: 'Indus Recycling',
            addressLine1: '4 Port Lane East'
          }
        ]
      }
    ])
  })

  test('Should list a site removed for the new year as re-ex only, and a site added as registration service only', () => {
    const matches = matchOverseasSites(
      [
        reExSite({
          orsId: '002',
          overseasReprocessorName: 'Andes Paper',
          destinationCountry: 'Chile',
          addressLine1: '1 Calle Uno'
        })
      ],
      [
        registrationServiceSite({
          orsId: '101',
          overseasReprocessorName: 'Delta Metals',
          destinationCountry: 'Vietnam',
          addressLine1: null
        })
      ]
    )

    expect(matches.reExOnly).toEqual([
      { site: expect.objectContaining({ orsId: '002' }), nearMatches: [] }
    ])
    expect(matches.registrationServiceOnly).toEqual([
      {
        site: expect.objectContaining({ orsId: '101' }),
        nearMatches: [],
        numberNeededBy: []
      }
    ])
  })

  test('Should match only within a registration, since two registrations can hold the same number for different sites', () => {
    const otherRegistration = {
      orgId: 500031,
      registrationNumber: 'R26ER5000310001AL'
    }
    const matches = matchOverseasSites(
      [reExSite(), reExSite({ ...otherRegistration, ...indusRecycling })],
      [registrationServiceSite({ ...otherRegistration })]
    )

    expect(matches.sameNumber).toEqual([])
    expect(matches.reExOnly).toEqual([
      expect.objectContaining({
        site: expect.objectContaining({
          registrationNumber: 'R26ER5000310001AL'
        })
      }),
      {
        site: expect.objectContaining({
          registrationNumber: 'R26ER5000490001ST'
        }),
        nearMatches: []
      }
    ])
    expect(matches.registrationServiceOnly).toHaveLength(1)
  })

  test('Should list a registered-only exporter, which the registration service holds nothing for, as re-ex only', () => {
    const matches = matchOverseasSites(
      [
        reExSite({ orsId: '001' }),
        reExSite({ orsId: '002', ...indusRecycling })
      ],
      []
    )

    expect(
      matches.reExOnly.map(({ site, nearMatches }) => [site.orsId, nearMatches])
    ).toEqual([
      ['001', []],
      ['002', []]
    ])
  })

  test('Should list every site of a registration re-ex holds no sites for as registration service only, those with no number last', () => {
    const matches = matchOverseasSites(
      [],
      [
        registrationServiceSite({ orsId: null, ...indusRecycling }),
        registrationServiceSite({ orsId: '002' }),
        registrationServiceSite({ orsId: null }),
        registrationServiceSite({ orsId: '001', ...indusRecycling })
      ]
    )

    expect(
      matches.registrationServiceOnly.map(({ site, nearMatches }) => [
        site.orsId,
        nearMatches
      ])
    ).toEqual([
      ['001', []],
      ['002', []],
      [null, []],
      [null, []]
    ])
  })
})
