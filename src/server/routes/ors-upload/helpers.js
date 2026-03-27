const defaultPageSize = 50

export function normaliseRegistrationNumber(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function buildBackendPath({
  page = 1,
  pageSize = defaultPageSize,
  registrationNumber = '',
  all = false
} = {}) {
  const params = new URLSearchParams()

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

export function buildPageHref({ page, pageSize, registrationNumber = '' }) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize)
  })

  if (registrationNumber) {
    params.set('registrationNumber', registrationNumber)
  }

  return `/overseas-sites?${params.toString()}`
}

export function buildListHref({ registrationNumber = '' } = {}) {
  if (!registrationNumber) {
    return '/overseas-sites'
  }

  return `/overseas-sites?${new URLSearchParams({ registrationNumber }).toString()}`
}

export { defaultPageSize }
