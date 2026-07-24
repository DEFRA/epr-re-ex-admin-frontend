export const suspendAccreditationConfirmGetController = {
  handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    return h.view('routes/suspend-accreditation/confirm', {
      pageTitle: request.route.settings.app.pageTitle,
      heading: 'Suspend accreditation',
      overviewUrl,
      postUrl: `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/suspend`
    })
  }
}
