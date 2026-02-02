export function formatMaterialName(material) {
  return material.charAt(0).toUpperCase() + material.slice(1).toLowerCase()
}

export function formatTonnage(tonnage) {
  return tonnage.toFixed(2)
}
