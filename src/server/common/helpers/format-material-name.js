const materialDisplayNames = {
  aluminium: 'Aluminium',
  fibre: 'Fibre based composite',
  glass_other: 'Glass other',
  glass_re_melt: 'Glass re-melt',
  paper: 'Paper and board',
  plastic: 'Plastic',
  steel: 'Steel',
  wood: 'Wood'
}

/**
 * Map an effective-material key (including glass re-melt / other) to its
 * display name.
 * @param {string} material
 * @returns {string}
 */
export function formatMaterialName(material) {
  const displayName = materialDisplayNames[material.toLowerCase()]

  if (!displayName) {
    throw new Error(`Unknown material: ${material}`)
  }

  return displayName
}
