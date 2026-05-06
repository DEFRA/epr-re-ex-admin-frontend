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
  const num = Number(period)
  if (cadence === 'monthly') {
    return MONTHS[num - 1]
  }
  if (cadence === 'quarterly') {
    return `Quarter ${num}`
  }
  throw new Error(`Unknown cadence: '${cadence}'`)
}
