import { formatMaterialName } from './format-material-name.js'

describe('formatMaterialName', () => {
  test('maps a known material to its display name', () => {
    expect(formatMaterialName('aluminium')).toBe('Aluminium')
    expect(formatMaterialName('paper')).toBe('Paper and board')
    expect(formatMaterialName('fibre')).toBe('Fibre based composite')
    expect(formatMaterialName('plastic')).toBe('Plastic')
    expect(formatMaterialName('steel')).toBe('Steel')
    expect(formatMaterialName('wood')).toBe('Wood')
  })

  test('maps both glass variants to their display names', () => {
    expect(formatMaterialName('glass_re_melt')).toBe('Glass re-melt')
    expect(formatMaterialName('glass_other')).toBe('Glass other')
  })

  test('is case insensitive', () => {
    expect(formatMaterialName('PLASTIC')).toBe('Plastic')
    expect(formatMaterialName('GLASS_RE_MELT')).toBe('Glass re-melt')
  })

  test('throws for an unknown material', () => {
    expect(() => formatMaterialName('unobtainium')).toThrow(
      'Unknown material: unobtainium'
    )
  })
})
