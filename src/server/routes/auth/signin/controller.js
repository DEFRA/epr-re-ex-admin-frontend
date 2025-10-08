export const signinController = {
  handler(_request, h) {
    return h.view('unauthorised')
  }
}
