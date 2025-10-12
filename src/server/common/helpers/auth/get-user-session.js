import { config } from '../../../../config/config.js'

export async function getUserSession(request) {
  const sessionCookieName = config.get('session.cache.name')
  const userSession = await request.yar.get(sessionCookieName)

  // TO-DO: Check validations on sessionId
  return userSession
}
