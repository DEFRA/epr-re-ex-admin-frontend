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
      text: 'System logs',
      href: '/system-logs',
      current: request?.path === '/system-logs'
    }
  ]
}
