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
  return materialDisplayNames[material.toLowerCase()]
}

export function formatTonnage(tonnage) {
  return tonnage.toFixed(2)
}
