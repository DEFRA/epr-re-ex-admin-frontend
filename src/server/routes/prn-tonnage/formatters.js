import { roundForCsv } from '#server/common/helpers/round-for-csv.js'

export { formatMaterialName } from '#server/common/helpers/materials.js'

const tonnageDecimals = 0

const registrationTypeDisplayNames = {
  REPROCESSOR_INPUT: 'Reprocessor input',
  REPROCESSOR_OUTPUT: 'Reprocessor output',
  EXPORTER: 'Exporter'
}

const tonnageBandDisplayNames = {
  up_to_500: 'Up to 500 tonnes',
  up_to_5000: 'Up to 5,000 tonnes',
  up_to_10000: 'Up to 10,000 tonnes',
  over_10000: 'Over 10,000 tonnes'
}

export function formatRegistrationType(registrationType) {
  if (!registrationType) {
    return ''
  }
  return registrationTypeDisplayNames[registrationType] ?? registrationType
}

export function formatTonnageBand(tonnageBand) {
  if (!tonnageBand) {
    return ''
  }
  return tonnageBandDisplayNames[tonnageBand] ?? tonnageBand
}

export function formatTonnage(tonnage) {
  return String(roundForCsv(tonnage, tonnageDecimals))
}
