export const homeBreadcrumb = {
  text: 'Home',
  href: '/'
}

/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const homeController = {
  handler(_request, h) {
    return h.view('routes/home/index', {
      pageTitle: 'Home',
      heading: 'Home'
    })
  }
}
