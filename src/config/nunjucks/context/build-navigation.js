const navItems = [
  { text: 'Home', href: '/' },
  { text: 'Organisations', href: '/organisations' },
  { text: 'Linked organisations', href: '/linked-organisations' },
  { text: 'Public register', href: '/public-register' },
  { text: 'Tonnage monitoring', href: '/tonnage-monitoring' },
  { text: 'Waste balance availability', href: '/waste-balance-availability' },
  { text: 'Summary log uploads', href: '/summary-log' },
  { text: 'Overseas sites', href: '/overseas-sites', matchSubPaths: true },
  { text: 'PRN activity', href: '/prn-activity' },
  { text: 'PRN tonnage', href: '/prn-tonnage' },
  { text: 'Report submissions', href: '/report-submissions' },
  { text: 'System logs', href: '/system-logs' },
  { text: 'Queue management', href: '/queue-management', matchSubPaths: true }
]

export function buildNavigation(request) {
  return navItems.map(({ text, href, matchSubPaths }) => ({
    text,
    href,
    current:
      request?.path === href ||
      (matchSubPaths === true && request?.path?.startsWith(`${href}/`))
  }))
}
