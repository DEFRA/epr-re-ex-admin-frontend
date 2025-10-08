export async function clearUserSession(request) {
  const sessionId = request.state?.userSessionCookie?.sessionId
  if (sessionId) {
    // TODO abstract clear user session data in cache
    // Clear the session cache
    await request.server.app.cache.drop(sessionId)
  }
}
