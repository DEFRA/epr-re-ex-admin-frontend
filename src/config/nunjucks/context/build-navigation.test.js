import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        current: false,
        text: 'Home',
        href: '/'
      },
      {
        current: false,
        text: 'Organisations',
        href: '/organisations'
      },
      {
        current: false,
        text: 'Linked organisations',
        href: '/linked-organisations'
      },
      {
        current: false,
        text: 'Public register',
        href: '/public-register'
      },
      {
        current: false,
        text: 'Tonnage monitoring',
        href: '/tonnage-monitoring'
      },
      {
        current: false,
        text: 'Waste balance availability',
        href: '/waste-balance-availability'
      },
      {
        current: false,
        text: 'Summary log uploads',
        href: '/summary-log'
      },
      {
        current: false,
        text: 'Overseas sites',
        href: '/overseas-sites'
      },
      {
        current: false,
        text: 'PRN activity',
        href: '/prn-activity'
      },
      {
        current: false,
        text: 'PRN tonnage',
        href: '/prn-tonnage'
      },
      {
        current: false,
        text: 'Report submissions',
        href: '/report-submissions'
      },
      {
        current: false,
        text: 'System logs',
        href: '/system-logs'
      },
      {
        current: false,
        text: 'Queue management',
        href: '/queue-management'
      }
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        current: true,
        text: 'Home',
        href: '/'
      },
      {
        current: false,
        text: 'Organisations',
        href: '/organisations'
      },
      {
        current: false,
        text: 'Linked organisations',
        href: '/linked-organisations'
      },
      {
        current: false,
        text: 'Public register',
        href: '/public-register'
      },
      {
        current: false,
        text: 'Tonnage monitoring',
        href: '/tonnage-monitoring'
      },
      {
        current: false,
        text: 'Waste balance availability',
        href: '/waste-balance-availability'
      },
      {
        current: false,
        text: 'Summary log uploads',
        href: '/summary-log'
      },
      {
        current: false,
        text: 'Overseas sites',
        href: '/overseas-sites'
      },
      {
        current: false,
        text: 'PRN activity',
        href: '/prn-activity'
      },
      {
        current: false,
        text: 'PRN tonnage',
        href: '/prn-tonnage'
      },
      {
        current: false,
        text: 'Report submissions',
        href: '/report-submissions'
      },
      {
        current: false,
        text: 'System logs',
        href: '/system-logs'
      },
      {
        current: false,
        text: 'Queue management',
        href: '/queue-management'
      }
    ])
  })

  test('Should highlight overseas sites for status pages', () => {
    expect(
      buildNavigation(
        mockRequest({ path: '/overseas-sites/imports/import-123' })
      )
    ).toEqual(
      expect.arrayContaining([
        {
          current: true,
          text: 'Overseas sites',
          href: '/overseas-sites'
        }
      ])
    )
  })

  test('Should place report submissions before system logs', () => {
    const navigation = buildNavigation(
      mockRequest({ path: '/non-existent-path' })
    )
    const reportSubmissionsIndex = navigation.findIndex(
      (item) => item.text === 'Report submissions'
    )
    const systemLogsIndex = navigation.findIndex(
      (item) => item.text === 'System logs'
    )

    expect(reportSubmissionsIndex).toBe(systemLogsIndex - 1)
  })

  test('Should place overseas sites after summary log uploads', () => {
    const navigation = buildNavigation(
      mockRequest({ path: '/non-existent-path' })
    )
    const summaryLogIndex = navigation.findIndex(
      (item) => item.text === 'Summary log uploads'
    )
    const overseasSitesIndex = navigation.findIndex(
      (item) => item.text === 'Overseas sites'
    )

    expect(overseasSitesIndex).toBe(summaryLogIndex + 1)
  })

  test('Should include overseas sites when request is undefined', () => {
    const navigation = buildNavigation()
    const overseasSites = navigation.find(
      (item) => item.text === 'Overseas sites'
    )

    expect(overseasSites).toEqual({
      current: undefined,
      text: 'Overseas sites',
      href: '/overseas-sites'
    })
  })
})
