/**
 * Subset of the Entra ID JWT payload claims the app reads. Mirrors the
 * `DefraIdJwtPayload` typedef pattern used in epr-frontend and epr-backend.
 *
 * Authoritative claim list: Microsoft's id_token reference for v2.0 tokens
 * https://learn.microsoft.com/en-us/entra/identity-platform/id-tokens
 *
 * `login_hint` is optional — only present after a prior successful sign-in
 * when re-prompting the user.
 * @typedef {{
 *   oid: string
 *   name: string
 *   preferred_username: string
 *   login_hint?: string
 *   exp: number
 * }} EntraIdTokenPayload
 */

/**
 * Subset of the OpenID Connect discovery document the app reads.
 *
 * `authorization_endpoint`, `jwks_uri` and `token_endpoint` are REQUIRED by
 * OpenID Connect Discovery 1.0. `end_session_endpoint` belongs to the separate
 * RP-Initiated Logout spec and is optional.
 * https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
 * @typedef {{
 *   authorization_endpoint: string
 *   end_session_endpoint?: string
 *   jwks_uri: string
 *   token_endpoint: string
 * }} OidcConfig
 */

export {} // NOSONAR: javascript:S7787 - Required to make this file a module for JSDoc @import
