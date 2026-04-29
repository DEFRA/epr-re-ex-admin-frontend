export const toSlimOrganisation = ({
  id,
  orgId,
  companyDetails: { name, registrationNumber },
  status,
  submittedToRegulator
}) => ({
  id,
  orgId,
  name,
  registrationNumber,
  status,
  regulator: submittedToRegulator
})
