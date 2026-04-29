export const PAGE_SIZE = 50

export const buildPaginationLinks = ({ page, totalPages, searchTerm }) => {
  if (totalPages <= 1) {
    return {}
  }

  const linkFor = (n) => {
    const params = new URLSearchParams()

    if (searchTerm) {
      params.set('search', searchTerm)
    }

    params.set('page', String(n))

    return `/organisations?${params}`
  }

  const pagination = {}

  if (page > 1) {
    pagination.previous = { href: linkFor(page - 1) }
  }

  if (page < totalPages) {
    pagination.next = { href: linkFor(page + 1) }
  }

  return pagination
}
