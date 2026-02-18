export function buildNavigation(request) {
  return [
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
    {
      text: 'PRN activity',
      href: '/prn-activity',
      current: request?.path === '/prn-activity'
    },
    {
      text: 'System logs',
      href: '/system-logs',
      current: request?.path === '/system-logs'
    }
  ]
}
