export const organisationsBreadcrumb = {
  text: 'Organisations',
  href: '/organisations'
}

export const organisationsController = {
  async handler(_request, h) {
    return h.view('routes/organisations/index', {
      pageTitle: 'Organisations',
      heading: 'Organisations'
    })
  }
}
