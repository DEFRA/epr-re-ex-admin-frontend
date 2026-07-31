import {
  GLASS_RECYCLING_PROCESS,
  MATERIAL,
  formatMaterialName
} from './materials.js'

describe('materials', () => {
  describe('formatMaterialName', () => {
    it.each([
      [MATERIAL.ALUMINIUM, 'Aluminium'],
      [MATERIAL.FIBRE, 'Fibre-based composite'],
      [MATERIAL.PAPER, 'Paper and board'],
      [MATERIAL.PLASTIC, 'Plastic'],
      [MATERIAL.STEEL, 'Steel'],
      [MATERIAL.WOOD, 'Wood']
    ])('should map %s to %s', (material, expected) => {
      expect(formatMaterialName(material)).toBe(expected)
    })

    it.each([
      [GLASS_RECYCLING_PROCESS.GLASS_RE_MELT, 'Glass remelt'],
      [GLASS_RECYCLING_PROCESS.GLASS_OTHER, 'Glass other']
    ])('should map %s to %s', (process, expected) => {
      expect(formatMaterialName(process)).toBe(expected)
    })

    it('should map bare glass, which the prn-tonnage report reports on', () => {
      expect(formatMaterialName(MATERIAL.GLASS)).toBe('Glass')
    })

    it.each([
      ['PLASTIC', 'Plastic'],
      ['GLASS_RE_MELT', 'Glass remelt']
    ])('should accept %s regardless of case', (material, expected) => {
      expect(formatMaterialName(material)).toBe(expected)
    })

    it('should throw for an unknown material', () => {
      expect(() => formatMaterialName('unobtainium')).toThrow(
        'Unknown material: unobtainium'
      )
    })
  })
})
