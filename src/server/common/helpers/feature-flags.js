import { config } from '#config/config.js'

export const FEATURE_FLAGS = Object.freeze({
  prnAdminCancellation: config.get('featureFlags.prnAdminCancellation')
})
