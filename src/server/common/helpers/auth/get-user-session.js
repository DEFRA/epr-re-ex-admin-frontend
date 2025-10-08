export async function getUserSession(request) {
  const sessionId = request.state?.userSessionCookie?.sessionId
  return sessionId ? await request.server.app.cache.get(sessionId) : null
}
