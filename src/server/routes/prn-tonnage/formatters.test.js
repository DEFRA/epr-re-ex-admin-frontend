import {
  formatMaterialName,
  formatTonnageBand,
  formatTonnage
} from './formatters.js'

describe('prn-tonnage formatters', () => {
  test('Should format known material names and preserve unknowns', () => {
    expect(formatMaterialName('glass_re_melt')).toBe('Glass re-melt')
    expect(formatMaterialName('GLASS_RE_MELT')).toBe('Glass re-melt')
    expect(formatMaterialName('unknown_material')).toBe('unknown_material')
    expect(formatMaterialName(undefined)).toBeUndefined()
  })

  test('Should format known tonnage bands and handle missing or unknown values', () => {
    expect(formatTonnageBand('up_to_500')).toBe('Up to 500 tonnes')
    expect(formatTonnageBand('over_10000')).toBe('Over 10,000 tonnes')
    expect(formatTonnageBand('custom_band')).toBe('custom_band')
    expect(formatTonnageBand(null)).toBe('')
    expect(formatTonnageBand('')).toBe('')
  })

  test('Should format tonnage values as whole numbers', () => {
    expect(formatTonnage(1)).toBe('1')
    expect(formatTonnage(12.345)).toBe('12')
    expect(formatTonnage(null)).toBe('0')
  })
})
