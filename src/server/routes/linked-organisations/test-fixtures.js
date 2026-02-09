export const mockLinkedOrg = {
  id: 'org-1',
  orgId: 101,
  companyDetails: { name: 'Acme Ltd', registrationNumber: '12345678' },
  status: 'active',
  linkedDefraOrganisation: {
    orgId: 'defra-uuid-1',
    orgName: 'Defra Org One',
    linkedAt: '2025-06-15T10:30:00.000Z',
    linkedBy: { email: 'admin@defra.gov.uk', id: 'user-uuid-1' }
  }
}

export const mockLinkedOrgs = [
  mockLinkedOrg,
  {
    id: 'org-2',
    orgId: 202,
    companyDetails: { name: 'Beta Corp', registrationNumber: '87654321' },
    status: 'active',
    linkedDefraOrganisation: {
      orgId: 'defra-uuid-2',
      orgName: 'Defra Org Two',
      linkedAt: '2025-07-20T14:00:00.000Z',
      linkedBy: { email: 'other@defra.gov.uk', id: 'user-uuid-2' }
    }
  }
]
