const masterOrder = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

export function uniqueMonthNames(data) {
  if (!data.materials || data.materials.length === 0) {
    return []
  }

  const presentMonths = new Set()
  for (const material of data.materials) {
    for (const m of material.months) {
      presentMonths.add(m.month)
    }
  }
  return masterOrder.filter((month) => presentMonths.has(month))
}

export function buildMaterialRowData(data) {
  const monthNames = uniqueMonthNames(data)
  const hasMultipleYears = new Set(data.materials.map((m) => m.year)).size > 1

  const rows = []
  let currentYear, currentType, typeTotal, yearTotal

  for (const item of data.materials) {
    const monthValues = mapMonthValues(item.months, monthNames)

    if (currentYear && currentYear !== item.year) {
      rows.push(typeTotal, yearTotal)
      typeTotal = yearTotal = null
    } else if (currentType && currentType !== item.type) {
      rows.push(typeTotal)
      typeTotal = null
    } else {
      // Continue with existing totals
    }

    typeTotal ??= initTypeTotal(item, monthNames)
    yearTotal ??= initYearTotal(item, monthNames)

    rows.push({
      material: item.material,
      monthValues,
      type: item.type,
      year: item.year
    })

    accumulate(typeTotal, monthValues, monthNames)
    accumulate(yearTotal, monthValues, monthNames)

    currentYear = item.year
    currentType = item.type
  }

  if (typeTotal) {
    rows.push(typeTotal, yearTotal)
  }

  return { hasMultipleYears, monthNames, rows }
}

function initTypeTotal(item, monthNames) {
  return {
    monthValues: Object.fromEntries(monthNames.map((m) => [m, undefined])),
    type: item.type,
    year: item.year
  }
}

function initYearTotal(item, monthNames) {
  return {
    monthValues: Object.fromEntries(monthNames.map((m) => [m, undefined])),
    year: item.year
  }
}

function mapMonthValues(months, names) {
  return Object.fromEntries(
    names.map((n) => [n, months.find((m) => m.month === n)?.tonnage])
  )
}

function accumulate(totalRow, currentValues, names) {
  for (const month of names) {
    const currentVal = currentValues[month]

    if (currentVal !== undefined) {
      totalRow.monthValues[month] =
        (totalRow.monthValues[month] ?? 0) + currentVal
    }
  }
}
