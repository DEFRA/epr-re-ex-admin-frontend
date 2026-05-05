const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export function formatPeriod(period, cadence) {
  if (cadence === 'monthly') {
    return MONTHS[Number.parseInt(period, 10) - 1]
  }
  if (cadence === 'quarterly') {
    return `Quarter ${period}`
  }
  return `${cadence.charAt(0).toUpperCase()}${cadence.slice(1)} ${period}`
}
