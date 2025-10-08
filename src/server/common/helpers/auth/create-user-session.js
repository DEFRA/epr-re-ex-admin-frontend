export async function createUserSession(request, sessionId, payload) {
  await request.server.app.cache.set(sessionId, payload)
}
