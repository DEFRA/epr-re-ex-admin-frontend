import { config } from '#config/config.js'

export { SCOPES } from '#server/common/helpers/auth/scopes.js'
export const featureFlagReportUnsubmit = config.get('featureFlagReportUnsubmit')
