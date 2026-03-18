import { buildNavigation } from './build-navigation.js'
import { config } from '#config/config.js'

vi.mock('#config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  beforeEach(() => {
    config.get.mockReturnValue(false)
  })

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
        text: 'System logs',
        href: '/system-logs'
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
        text: 'System logs',
        href: '/system-logs'
      }
    ])
  })

  test('Should highlight ORS uploads for status pages', () => {
    config.get.mockReturnValue(true)

    expect(
      buildNavigation(
        mockRequest({ path: '/overseas-sites/imports/import-123' })
      )
    ).toEqual(
      expect.arrayContaining([
        {
          current: true,
          text: 'ORS uploads',
          href: '/overseas-sites/imports'
        }
      ])
    )
  })

  test('Should include ORS uploads when feature flag enabled', () => {
    config.get.mockReturnValue(true)

    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual(
      expect.arrayContaining([
        {
          current: false,
          text: 'ORS uploads',
          href: '/overseas-sites/imports'
        }
      ])
    )
  })
})
