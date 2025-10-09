import { readFromSession } from '../../session-storage/index.js'

/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const homeController = {
  handler(_request, h) {
    const userData = readFromSession('user')

    return h.view('routes/home/index', {
      pageTitle: 'Home',
      heading: 'Home',
      loggedIn: !!userData,
      username: userData?.username
    })
  }
}
