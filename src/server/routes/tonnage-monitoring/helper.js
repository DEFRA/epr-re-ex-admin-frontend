export function uniqueMonthNames(data) {
  if (data.materials.length === 0) {
    return []
  }

  return data.materials
    .reduce(
      (max, item) => (item.months.length > max.length ? item.months : max),
      []
    )
    .map((m) => m.month)
}
