import yar from '@hapi/yar'

import { config } from '#config/config.js'

const sessionConfig = config.get('session')

// TO-DO: We must document the cache name env var (or hardcode it)

export const sessionCache = {
  plugin: yar,
  options: {
    name: sessionConfig.cache.name,
    maxCookieSize: 0, // This forces the cookie to be stored server-side (only the session id is stored in a client cookie)
    cache: {
      cache: sessionConfig.cache.name,
      // TO-DO: The default expiration for `yar` is 1day. It's good for CDP Portal
      // This is for the server-side storage
      // Can't we do the same?
      expiresIn: sessionConfig.cache.ttl
    },
    storeBlank: false,
    errorOnCacheNotReady: true,
    cookieOptions: {
      // TO-DO: We need to make sure we set one. Or is CDP Portal setting one automatically?
      password: sessionConfig.cookie.password,
      // TO-DO: This the time the cookie needs to live in the browser
      ttl: sessionConfig.cookie.ttl,
      isSecure: config.get('session.cookie.secure'),
      clearInvalid: true
    }
  }
}
