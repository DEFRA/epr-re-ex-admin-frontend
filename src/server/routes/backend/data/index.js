import { statusCodes } from '../../../common/constants/status-codes.js'
import jwt from '@hapi/jwt'
import { fetchWellknown } from '../../auth/fetch-well-known.js'
import { config } from '../../../../config/config.js'

export const data = {
  plugin: {
    name: 'data',
    async register(server) {
      await server.register([jwt])

      const entraWellKnownDetails = await fetchWellknown(
        config.get('oidc.azureAD.wellKnownUrl')
      )
      const defraIdWellKnownDetails = await fetchWellknown(
        config.get('oidc.defraId.wellKnownUrl')
      )

      server.auth.strategy(
        'aad-access-token',
        'jwt',
        aadJwtOptions(entraWellKnownDetails)
      )
      server.auth.strategy(
        'defra-id-access-token',
        'jwt',
        defraIdJwtOptions(defraIdWellKnownDetails)
      )

      server.auth.scheme('delegating', delegatingAuthScheme)

      server.auth.strategy('access-token', 'delegating', {
        candidateStrategies: [
          {
            strategy: 'aad-access-token',
            test(token) {
              return token.iss === entraWellKnownDetails.issuer
            }
          },
          {
            strategy: 'defra-id-access-token',
            test(token) {
              return token.iss === defraIdWellKnownDetails.issuer
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

function aadJwtOptions({ jwks_uri: jwksUri, issuer }) {
  return {
    keys: {
      uri: jwksUri
    },
    verify: {
      aud: config.get('oidc.azureAD.clientId'),
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
        id: tokenPayload.oid,
        email: tokenPayload.upn,
        issuer: tokenPayload.iss,
        scope: lookupUserRoles(tokenPayload.upn)
      }

      return { isValid: true, credentials }
    }
  }
}

function defraIdJwtOptions({ jwks_uri: jwksUri, issuer }) {
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
        candidate.test(decodedToken)
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
