import { isNil } from '#server/common/helpers/is-nil.js'
import { formatMaterialName } from '#server/common/helpers/format-material-name.js'

export function formatTonnage(tonnage) {
  if (isNil(tonnage)) {
    return ''
  }
  return tonnage.toFixed(2)
}

export function materialRowHeading(row) {
  if (row.material) {
    return formatMaterialName(row.material)
  } else if (isNil(row.type)) {
    return 'Total'
  } else {
    return ''
  }
}
