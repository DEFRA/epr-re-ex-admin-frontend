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
    }
  ]
}
