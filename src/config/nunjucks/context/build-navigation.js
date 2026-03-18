import { config } from '#config/config.js'

export function buildNavigation(request) {
  const navigation = [
    {
      text: 'Home',
      href: '/',
      current: request?.path === '/'
    },
    {
      text: 'Organisations',
      href: '/organisations',
      current: request?.path === '/organisations'
    },
    {
      text: 'Linked organisations',
      href: '/linked-organisations',
      current: request?.path === '/linked-organisations'
    },
    {
      text: 'Public register',
      href: '/public-register',
      current: request?.path === '/public-register'
    },
    {
      text: 'Tonnage monitoring',
      href: '/tonnage-monitoring',
      current: request?.path === '/tonnage-monitoring'
    },
    {
      text: 'Waste balance availability',
      href: '/waste-balance-availability',
      current: request?.path === '/waste-balance-availability'
    },
    {
      text: 'Summary log uploads',
      href: '/summary-log',
      current: request?.path === '/summary-log'
    },
    ...orsNavigation,
    {
      text: 'PRN activity',
      href: '/prn-activity',
      current: request?.path === '/prn-activity'
    },
    {
      text: 'PRN tonnage',
      href: '/prn-tonnage',
      current: request?.path === '/prn-tonnage'
    },
    {
      text: 'System logs',
      href: '/system-logs',
      current: request?.path === '/system-logs'
    }
  ]

  if (config.get('featureFlags.overseasSites')) {
    navigation.splice(7, 0, {
      text: 'ORS uploads',
      href: '/overseas-sites/imports',
      current:
        request?.path === '/overseas-sites/imports' ||
        request?.path?.startsWith('/overseas-sites/imports/')
    })
  }

  return navigation
}
