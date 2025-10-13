import { config } from '#config/config.js'

export async function getUserSession(request) {
  try {
    const sessionCookieName = config.get('session.cache.name')
    const userSession = await request.yar.get(sessionCookieName)

    // TO-DO: Check validations on sessionId
    return userSession
  } catch (error) {
    // Return null if session retrieval fails (e.g., during error handling)
    return null
  }
}
