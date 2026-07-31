/**
 * Packaging materials and how they are shown on screen.
 *
 * Display names follow epr-frontend, which is the source of truth for how a
 * material reads to a user. They deliberately differ from the labels
 * epr-backend puts in the public register CSV, which are frozen because that
 * register is published: 'Fibre based composite' without the hyphen there, and
 * 'Glass-remelt' rather than 'Glass remelt'.
 */

/**
 * @typedef {typeof MATERIAL[keyof typeof MATERIAL]} Material
 */
export const MATERIAL = Object.freeze({
  ALUMINIUM: 'aluminium',
  FIBRE: 'fibre',
  GLASS: 'glass',
  PAPER: 'paper',
  PLASTIC: 'plastic',
  STEEL: 'steel',
  WOOD: 'wood'
})

/**
 * @typedef {typeof GLASS_RECYCLING_PROCESS[keyof typeof GLASS_RECYCLING_PROCESS]} GlassRecyclingProcess
 */
export const GLASS_RECYCLING_PROCESS = Object.freeze({
  GLASS_RE_MELT: 'glass_re_melt',
  GLASS_OTHER: 'glass_other'
})

/**
 * Keyed by every value a report can arrive with. Most report on the effective
 * material, where glass is split into its recycling process, but prn-tonnage
 * reports on the registration's material, so bare `glass` is also a key.
 * @type {Record<Material | GlassRecyclingProcess, string>}
 */
const materialToDisplayName = Object.freeze({
  [MATERIAL.ALUMINIUM]: 'Aluminium',
  [MATERIAL.FIBRE]: 'Fibre-based composite',
  [MATERIAL.GLASS]: 'Glass',
  [MATERIAL.PAPER]: 'Paper and board',
  [MATERIAL.PLASTIC]: 'Plastic',
  [MATERIAL.STEEL]: 'Steel',
  [MATERIAL.WOOD]: 'Wood',
  [GLASS_RECYCLING_PROCESS.GLASS_RE_MELT]: 'Glass remelt',
  [GLASS_RECYCLING_PROCESS.GLASS_OTHER]: 'Glass other'
})

/**
 * Map a material as it arrives from epr-backend to its display name. Values
 * come off an HTTP response rather than a validated read, so the case is
 * normalised and an unrecognised value is an error rather than a silently odd
 * label.
 *
 * @param {string} material
 * @returns {string}
 */
export const formatMaterialName = (material) => {
  const displayName = materialToDisplayName[material?.toLowerCase()]

  if (!displayName) {
    throw new Error(`Unknown material: ${material}`)
  }

  return displayName
}
