import { config } from '../../../../config/config.js'

export async function clearUserSession(request) {
  request.cookieAuth.clear()

  // TO-DO: Figure out if we need to do some check on sessionId
  const sessionName = config.get('session.cache.name')
  await request.yar.clear(sessionName)
}
