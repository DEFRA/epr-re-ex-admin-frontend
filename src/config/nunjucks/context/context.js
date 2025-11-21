import path from 'node:path'
import { readFileSync } from 'node:fs'

import { config } from '#config/config.js'
import { buildNavigation } from './build-navigation.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)

let webpackManifest

export async function context(request) {
  const userSession = await getUserSession(request)
  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(`Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  return {
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    userSession,
    isAuthenticated: userSession?.isAuthenticated ?? false,
    navigation: buildNavigation(request),
    getAssetPath(asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}
