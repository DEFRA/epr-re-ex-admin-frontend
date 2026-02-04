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

export function formatMaterialName(material) {
  const key = material.toLowerCase()
  const displayName = materialDisplayNames[key]

  if (!displayName) {
    throw new Error(`Unknown material: ${material}`)
  }

  return displayName
}

export function formatTonnage(tonnage) {
  return tonnage.toFixed(2)
}
