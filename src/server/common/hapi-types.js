/**
 * @import { Request, Server } from '@hapi/hapi'
 * @import { Yar } from '@hapi/yar'
 * @import { TypedLogger } from './helpers/logging/logger.js'
 */

/**
 * @typedef {{
 *   sessionId: string,
 *   userId: string,
 *   displayName: string,
 *   email: string,
 *   loginHint?: string,
 *   isAuthenticated: true,
 *   token: string,
 *   refreshToken: string
 * }} UserSession
 */

/**
 * @typedef {{
 *   (type: 'referrer'): string[]
 * } & Yar['flash']} HapiYarFlash
 */

/**
 * @typedef {Omit<Yar, 'flash'> & { flash: HapiYarFlash }} HapiYar
 */

/**
 * @typedef {Omit<Server, 'logger'> & {
 *   logger: TypedLogger
 * }} HapiServer
 */

/**
 * @typedef {Omit<Request, 'logger' | 'yar'> & {
 *   logger: TypedLogger,
 *   yar: HapiYar
 * }} HapiRequest
 */

export {} // NOSONAR: javascript:S7787 - Required to make this file a module for JSDoc @import
