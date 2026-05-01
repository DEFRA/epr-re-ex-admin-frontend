export {}

declare module '@hapi/hapi' {
  interface RouteOptionsApp {
    pageTitle?: string
  }
}
