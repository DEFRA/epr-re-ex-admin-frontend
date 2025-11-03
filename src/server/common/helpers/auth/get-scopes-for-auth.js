import { config } from '#config/config.js'

const getScopesForAuth = () => [
  'openid',
  'profile',
  'email',
  'offline_access',
  `api://${config.get('entraId.clientId')}/.default`
]

export { getScopesForAuth }
