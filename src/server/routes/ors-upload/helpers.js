const defaultPageSize = 50

export function normaliseRegistrationNumber(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function buildBackendPath({
  year,
  page = 1,
  pageSize = defaultPageSize,
  registrationNumber = '',
  all = false
}) {
  const params = new URLSearchParams({ year })

  if (all) {
    params.set('all', 'true')
  } else {
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
  }

  if (registrationNumber) {
    params.set('registrationNumber', registrationNumber)
  }

  return `/v1/admin/overseas-sites?${params.toString()}`
}

export function buildPageHref({
  year,
  page,
  pageSize,
  registrationNumber = ''
}) {
  const params = new URLSearchParams({
    year,
    page: String(page),
    pageSize: String(pageSize)
  })

  if (registrationNumber) {
    params.set('registrationNumber', registrationNumber)
  }

  return `/overseas-sites?${params.toString()}`
}

export { defaultPageSize }
