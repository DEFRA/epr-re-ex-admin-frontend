/**
 * @typedef {object} UserSession
 * @property {string} id
 * @property {string} email
 * @property {string} displayName
 * @property {boolean} isAuthenticated
 */

const hardcodedUser = {
  id: '1111',
  email: 'john.doe@example.com',
  displayName: 'John Doe',
  isAuthenticated: true
}

/**
 * Get the user session from the cache
 * @returns {Promise<UserSession | null>}
 */
async function getUserSession() {
  return hardcodedUser
}

export { getUserSession }
