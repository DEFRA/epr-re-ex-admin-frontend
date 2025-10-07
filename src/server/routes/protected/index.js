export const protectedRoute = {
  plugin: {
    name: 'protected',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/protected',
          handler(_request, h) {
            return h.view('routes/protected/index', {
              pageTitle: 'Protected',
              heading: 'Protected'
            })
          },
          options: {
            // auth: false // auth not required (disables default scheme for this route)
            // auth: 'strategy-name' // uses the named strategy in "required" mode
            auth: {
              strategy: 'session', // only allow access to this page if the 'session' auth strategy is satisfied (ie a session cookie exists with a session ID, and session data exists in the cache for that ID)
              mode: 'required'
              // access: {
              //   scope: ['+service_maintainer'] // only permit access to this page if (logged in) user has service_maintainer scope
              // }
            }
          }
        }
      ])
    }
  }
}
