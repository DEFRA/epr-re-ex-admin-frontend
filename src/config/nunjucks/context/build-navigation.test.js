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
        text: 'Summary log uploads',
        href: '/summary-log'
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
        text: 'Summary log uploads',
        href: '/summary-log'
      },
      {
        current: false,
        text: 'System logs',
        href: '/system-logs'
      }
    ])
  })
})
