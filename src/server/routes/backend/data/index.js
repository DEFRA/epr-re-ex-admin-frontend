import { statusCodes } from '../../../common/constants/status-codes.js'
import jwt from '@hapi/jwt'
import {
  fetchDefraIdWellKnown,
  fetchEntraIdWellKnown
} from '../../auth/fetch-well-known.js'
import { config } from '../../../../config/config.js'

export const data = {
  plugin: {
    name: 'data',
    async register(server) {
      await server.register([jwt])

      const entraWellKnownDetails = await fetchEntraIdWellKnown()
      const defraIdWellKnownDetails = await fetchDefraIdWellKnown()

      server.auth.strategy(
        'access-token',
        'jwt',
        entraOrDefraJwtOptions({
          defra: {
            audience: config.get('oidc.defraId.clientId'),
            jwksUri: defraIdWellKnownDetails.jwks_uri,
            issuer: defraIdWellKnownDetails.issuer
          },
          entra: {
            audience: config.get('oidc.entraId.clientId'),
            jwksUri: entraWellKnownDetails.jwks_uri,
            issuer: entraWellKnownDetails.issuer
          }
        })
      )

      server.route([
        {
          method: 'GET',
          path: '/backend/data',
          options: {
            auth: {
              strategy: 'access-token',
              access: {
                scope: ['service_maintainer', 'user'] // only permit access to this page if (logged in) user has service_maintainer or user scope
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

function entraOrDefraJwtOptions({
  defra: {
    jwksUri: defraJwksUri,
    issuer: defraIssuer,
    audience: defraAudience
  },
  entra: { jwksUri: entraJwksUri, issuer: entraIssuer, audience: entraAudience }
}) {
  return {
    keys: [{ uri: defraJwksUri }, { uri: entraJwksUri }],
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 5400, // 90 minutes
      timeSkewSec: 15
    },
    validate: async (artifacts, request) => {
      console.log('Validate JWT token')

      const tokenPayload = artifacts.decoded.payload

      switch (tokenPayload.iss) {
        case defraIssuer: {
          console.log('Defra ID token')

          const isAudienceCorrect = tokenPayload.aud === defraAudience

          // Defra ID specific token parsing
          const credentials = {
            id: tokenPayload.contactId,
            email: tokenPayload.email,
            issuer: tokenPayload.iss,
            scope: lookupDefraUserRoles(tokenPayload, request)
          }

          console.log('isAudienceCorrect', isAudienceCorrect, tokenPayload.aud)
          return {
            isValid: isAudienceCorrect,
            credentials
          }
        }
        case entraIssuer: {
          console.log('Entra ID token')

          const isAudienceCorrect = tokenPayload.aud === entraAudience

          const email = tokenPayload.upn ?? tokenPayload.preferred_username

          // Entra ID specific token parsing
          const credentials = {
            id: tokenPayload.oid,
            email,
            issuer: tokenPayload.iss,
            scope: isEntraUserInServiceMaintainersAllowList(email)
              ? ['service_maintainer']
              : []
          }

          console.log('isAudienceCorrect', isAudienceCorrect, tokenPayload.aud)
          return {
            isValid: isAudienceCorrect,
            credentials
          }
        }
        default: {
          console.log(`Unknown token issuer: ${tokenPayload.iss}`)
          return { isValid: false }
        }
      }
    }
  }
}

function isEntraUserInServiceMaintainersAllowList(emailAddress) {
  // TODO look for emailAddress in configured list of service maintainers
  return true
}

// illustrative - real lookup would be based on ???
function lookupDefraUserRoles(token, request) {
  return ['user']
}
