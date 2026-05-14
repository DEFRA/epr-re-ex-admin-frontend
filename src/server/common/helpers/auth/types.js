/**
 * Subset of the Entra ID JWT payload claims the app reads. Mirrors the
 * `DefraIdJwtPayload` typedef pattern used in epr-frontend and epr-backend.
 *
 * Authoritative claim list: Microsoft's id_token reference for v2.0 tokens
 * https://learn.microsoft.com/en-us/entra/identity-platform/id-tokens
 *
 * `login_hint` is optional — only present after a prior successful sign-in
 * when re-prompting the user.
 *
 * `email` is optional — real Entra ID tokens carry the address under
 * `preferred_username`; the local `epr-re-ex-entra-stub` emits it under
 * `email`, so sign-in accepts either.
 * @typedef {{
 *   oid: string
 *   name: string
 *   preferred_username: string
 *   email?: string
 *   login_hint?: string
 *   exp: number
 * }} EntraIdTokenPayload
 */

export {} // NOSONAR: javascript:S7787 - Required to make this file a module for JSDoc @import
