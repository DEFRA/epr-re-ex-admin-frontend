import yar from '@hapi/yar'
import { config } from '#config/config.js'

const sessionConfig = config.get('session')

export const sessionCache = {
  plugin: yar,
  options: {
    name: sessionConfig.cache.name,
    maxCookieSize: 0, // This forces the session data to be stored server-side (only the session id is stored in a client cookie)
    cache: {
      cache: sessionConfig.cache.name,
      expiresIn: sessionConfig.cache.ttl
    },
    storeBlank: false,
    errorOnCacheNotReady: true,
    cookieOptions: {
      password: sessionConfig.cookie.password,
      ttl: sessionConfig.cookie.ttl,
      isSecure: config.get('session.cookie.secure'),
      clearInvalid: true
    }
  }
}
