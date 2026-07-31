export { formatMaterialName } from '#server/common/helpers/materials.js'

export function formatAmount(amount) {
  return (amount ?? 0).toFixed(2)
}
