export const signoutController = {
  handler: async (request, h) => {
    if (request.auth.isAuthenticated) {
      const { sessionId } = request.auth.credentials
      if (sessionId) {
        await request.server.app.cache.drop(sessionId)
      }
      request.cookieAuth.clear()
    }

    return h.redirect('/')
  }
}
