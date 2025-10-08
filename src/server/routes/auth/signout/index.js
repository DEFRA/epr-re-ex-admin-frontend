export default [
  {
    method: 'GET',
    path: '/auth/signout',
    options: {
      auth: false
    },
    handler: async (request, h) => {
      // TO-DO: Alternatively, we could check if getUserSession returns a session
      if (!request.auth.isAuthenticated) {
        // User is already signed-out
      return h.redirect('/')
      }



        const { sessionId } = request.auth.credentials
        if (sessionId) {
        // TO-DO: For consistency, we probably want to extract this into a helper function
          await request.server.app.cache.drop(sessionId)
        }
        request.cookieAuth.clear()
    }
  }
]




    const signOutUrl = await getSignOutUrl(request, request.auth.credentials.token)
    return h.redirect(signOutUrl)
  }
