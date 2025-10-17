import { config } from '#config/config.js'

export async function getUserSession(request) {
  try {
    const sessionCookieName = config.get('session.cache.name')
    const userSession = await request.yar.get(sessionCookieName)

    return userSession
  } catch {
    return null
  }
}
