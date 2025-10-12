/**
 * A GDS styled organisations page controller.
 * Provided as an example, remove or modify as required.
 */
export const organisationsController = {
  handler(_request, h) {
    return h.view('routes/organisations/index', {
      pageTitle: 'Organisations',
      heading: 'Organisations',
      breadcrumbs: [
        {
          text: 'Home',
          href: '/'
        },
        {
          text: 'Organisations'
        }
      ]
    })
  }
}
