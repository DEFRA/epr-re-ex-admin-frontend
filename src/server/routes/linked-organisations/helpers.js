export function buildBackendPath(searchTerm) {
  if (searchTerm) {
    return `/v1/linked-organisations?name=${encodeURIComponent(searchTerm)}`
  }
  return '/v1/linked-organisations'
}

export function mapLinkedOrganisations(data) {
  return (Array.isArray(data) ? data : []).map(
    ({
      orgId,
      companyDetails: { name },
      linkedDefraOrganisation: {
        orgId: defraOrgId,
        orgName,
        linkedAt,
        linkedBy
      }
    }) => ({
      eprOrgName: name,
      eprOrgId: orgId,
      defraOrgName: orgName,
      defraOrgId,
      linkedAt,
      linkedByEmail: linkedBy.email
    })
  )
}
