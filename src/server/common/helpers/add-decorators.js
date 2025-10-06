import { getUserSession } from './auth/get-user-session.js'

/**
 * Add global server methods
 * @param {import('@hapi/hapi').Server} server
 */
function addDecorators(server) {
  server.decorate('request', 'getUserSession', getUserSession)
}

export { addDecorators }
