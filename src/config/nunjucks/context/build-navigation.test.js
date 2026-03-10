import { vi } from 'vitest'
import { config } from '#config/config.js'
import { buildNavigation } from './build-navigation.js'

const originalGet = config.get.bind(config)

function mockRequest(options) {
  return { ...options }
}

const baseItems = [
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
]

describe('#buildNavigation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual(baseItems)
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        current: true,
        text: 'Home',
        href: '/'
      },
      ...baseItems.slice(1)
    ])
  })

  test('Should include overseas sites link when orsEnabled is true', () => {
    vi.spyOn(config, 'get').mockImplementation((key) => {
      if (key === 'features.orsEnabled') return true
      return originalGet(key)
    })

    const nav = buildNavigation(mockRequest({ path: '/non-existent-path' }))

    expect(nav).toEqual([
      ...baseItems,
      {
        current: false,
        text: 'Overseas sites',
        href: '/overseas-sites/upload'
      }
    ])
  })

  test('Should highlight overseas sites link when on upload page', () => {
    vi.spyOn(config, 'get').mockImplementation((key) => {
      if (key === 'features.orsEnabled') return true
      return originalGet(key)
    })

    const nav = buildNavigation(mockRequest({ path: '/overseas-sites/upload' }))
    const overseasItem = nav.find((item) => item.text === 'Overseas sites')

    expect(overseasItem.current).toBe(true)
  })
})
