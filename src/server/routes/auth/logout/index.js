import { writeToSession } from '../../../session-storage/index.js'
import { fetchWellknown } from '../fetch-well-known.js'
import { config } from '../../../../config/config.js'

export async function GET(_request, h) {
  writeToSession('user', undefined)

  const { end_session_endpoint: aadLogoutUrl } = await fetchWellknown()

  const logoutUrl = encodeURI(
    `${aadLogoutUrl}?post_logout_redirect_uri=${config.get('appBaseUrl')}/`
  )

  return h.redirect(logoutUrl)
}
