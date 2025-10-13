import { config } from '#config/config.js'

export async function createUserSession(request, payload) {
  request.cookieAuth.set({ sessionId: payload.sessionId })

  const sessionName = config.get('session.cache.name')
  await request.yar.set(sessionName, payload)
}
