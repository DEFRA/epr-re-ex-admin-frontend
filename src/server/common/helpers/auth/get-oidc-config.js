import Wreck from '@hapi/wreck'
import { config } from '../../../../config/config.js'

async function getOidcConfig() {
  // Fetch the OpenID Connect configuration from the well-known endpoint
  // Contains several bits of information necessary for OIDC authentication
  const { payload } = await Wreck.get(
    config.get('entraId.oidcWellKnownConfigurationUrl'),
    {
      json: true
    }
  )

  return payload
}

export { getOidcConfig }
