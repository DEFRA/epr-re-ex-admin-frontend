import { statusCodes } from '../../../common/constants/status-codes.js'
import jwt from '@hapi/jwt'
import { fetchWellknown } from '../../auth/fetch-well-known.js'
import { config } from '../../../../config/config.js'

export const data = {
  plugin: {
    name: 'data',
    async register(server) {
      await server.register([jwt])

      server.auth.strategy('aad-access-token', 'jwt', await aadJwtOptions())
      server.auth.strategy(
        'defra-id-access-token',
        'jwt',
        await defraIdJwtOptions()
      )

      server.auth.scheme('delegating', delegatingAuthScheme)

      server.auth.strategy('access-token', 'delegating', {
        candidateStrategies: [
          {
            strategy: 'aad-access-token',
            test(issuer) {
              return issuer.includes('sts.windows.net')
            }
          },
          {
            strategy: 'defra-id-access-token',
            test(issuer) {
              return issuer.includes('dcidmtest.b2clogin.com')
            }
          }
        ]
      })

      server.route([
        {
          method: 'GET',
          path: '/backend/data',
          options: {
            auth: {
              strategy: 'access-token',
              access: {
                scope: ['+service_maintainer'] // only permit access to this page if (logged in) user has service_maintainer scope
              }
            }
          },
          async handler(request, h) {
            const { issuer, id, email } = request.auth.credentials
            return h.response({ issuer, id, email }).code(statusCodes.ok)
          }
        }
      ])
    }
  }
}

async function aadJwtOptions() {
  const { jwks_uri: jwksUri } = await fetchWellknown(
    config.get('oidc.azureAD.wellKnownUrl')
  )

  return {
    keys: {
      uri: jwksUri
    },
    verify: false,
    // verify: {
    //   aud: config.get('oidc.azureAD.clientId'),
    //   // aud: '00000003-0000-0000-c000-000000000000', // TODO why is aud on AAD token this? Answer: this is the UUID for Microsoft Graph API!
    //   iss: `https://sts.windows.net/${config.get('oidc.azureAD.clientId')}/`, // TODO issuer in well known response not matching issuer of AAD access token!
    //   // iss: issuer,
    //   sub: false,
    //   nbf: true,
    //   exp: true,
    //   maxAgeSec: 5400, // 90 minutes
    //   timeSkewSec: 15
    // },
    validate: async (artifacts) => {
      const tokenPayload = artifacts.decoded.payload

      // parsing payload depends on whether its a Defra ID or AAD token
      const credentials = {
        id: tokenPayload.oid,
        email: tokenPayload.upn,
        issuer: tokenPayload.iss,
        scope: lookupUserRoles(tokenPayload.upn)
      }

      return { isValid: true, credentials }
    }
  }
}

async function defraIdJwtOptions() {
  const { jwks_uri: jwksUri, issuer } = await fetchWellknown(
    config.get('oidc.defraId.wellKnownUrl')
  )

  return {
    keys: {
      uri: jwksUri
    },
    verify: {
      aud: config.get('oidc.defraId.clientId'),
      iss: issuer,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 5400, // 90 minutes
      timeSkewSec: 15
    },
    validate: async (artifacts) => {
      const tokenPayload = artifacts.decoded.payload

      // parsing payload depends on whether its a Defra ID or AAD token
      const credentials = {
        id: tokenPayload.contactId,
        email: tokenPayload.email,
        issuer: tokenPayload.iss,
        scope: lookupUserRoles(tokenPayload.contactId)
      }

      return { isValid: true, credentials }
    }
  }
}

// illustrative - real lookup would be based on ???
function lookupUserRoles(emailAddress) {
  return ['service_maintainer']
}

function delegatingAuthScheme(server, { candidateStrategies }) {
  const extractAndDecodeBearerToken = (request) => {
    // TODO throw Boom.unauthorized if authorization header missing
    // TODO throw Boom.unauthorized if scheme not Bearer
    // TODO throw Boom.unauthorized if token not Bearer
    const [, token] = request.headers.authorization.split(/\s+/)

    // TODO throw Boom.unauthorized if decode fails
    return jwt.token.decode(token).decoded.payload
  }

  return {
    async authenticate(request, h) {
      const decodedToken = extractAndDecodeBearerToken(request)

      const delegateTo = candidateStrategies.find((candidate) =>
        candidate.test(decodedToken.iss)
      )

      // TODO throw Boom.unauthorized if no strategy found to delgate to

      const { credentials, artifacts } = await server.auth.test(
        delegateTo.strategy,
        request
      )
      return h.authenticated({ credentials, artifacts })
    }
  }
}
