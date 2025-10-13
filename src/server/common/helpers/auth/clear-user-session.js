import { config } from '#config/config.js'

export async function clearUserSession(request) {
  request.cookieAuth.clear()

  const sessionName = config.get('session.cache.name')
  await request.yar.clear(sessionName)
}
