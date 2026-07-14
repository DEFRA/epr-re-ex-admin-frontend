import {
  cutoffForReportMonth,
  isValidReportMonth,
  reportMonthItems
} from './months.js'

describe('reportMonthItems', () => {
  it('lists all complete months from January 2026 to the previous month, newest first', () => {
    const now = new Date('2026-07-14T12:00:00.000Z')

    const items = reportMonthItems(now)

    expect(items.map((item) => item.value)).toEqual([
      '2026-06',
      '2026-05',
      '2026-04',
      '2026-03',
      '2026-02',
      '2026-01'
    ])
    expect(items.map((item) => item.text)).toEqual([
      'June 2026',
      'May 2026',
      'April 2026',
      'March 2026',
      'February 2026',
      'January 2026'
    ])
  })

  it('selects only the previous month as the default', () => {
    const now = new Date('2026-07-14T12:00:00.000Z')

    const items = reportMonthItems(now)

    expect(items.map((item) => item.selected)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false
    ])
  })

  it('uses the London calendar when UTC has not yet reached the new month', () => {
    // 23:30 UTC on 30 June is already 00:30 BST on 1 July in London,
    // so June is complete and becomes the latest selectable month.
    const now = new Date('2026-06-30T23:30:00.000Z')

    const items = reportMonthItems(now)

    expect(items[0].value).toBe('2026-06')
    expect(items[0].selected).toBe(true)
  })

  it('lists no months before the service start', () => {
    const now = new Date('2026-01-15T12:00:00.000Z')

    const items = reportMonthItems(now)

    expect(items).toEqual([])
  })
})

describe('isValidReportMonth', () => {
  const now = new Date('2026-07-14T12:00:00.000Z')

  it('accepts every month from January 2026 to the previous month', () => {
    expect(isValidReportMonth('2026-01', now)).toBe(true)
    expect(isValidReportMonth('2026-06', now)).toBe(true)
  })

  it.each(['June 2026', '2026-6', '2026-13', '2026-00', 'garbage', ''])(
    'rejects the malformed value %j',
    (value) => {
      expect(isValidReportMonth(value, now)).toBe(false)
    }
  )

  it('rejects a non-string value, as Hapi yields for a repeated query param', () => {
    // A single-element array coerces to a passing string in the regex and
    // range checks, so only the string type guard rejects it.
    expect(isValidReportMonth(['2026-06'], now)).toBe(false)
    expect(isValidReportMonth(undefined, now)).toBe(false)
  })

  it('rejects months before the January 2026 service start', () => {
    expect(isValidReportMonth('2025-12', now)).toBe(false)
  })

  it('rejects the current month', () => {
    expect(isValidReportMonth('2026-07', now)).toBe(false)
  })

  it('rejects future months', () => {
    expect(isValidReportMonth('2027-01', now)).toBe(false)
  })

  it('accepts the month that has just completed on the London calendar', () => {
    // 23:30 UTC on 30 June is 00:30 BST on 1 July in London.
    const justAfterLondonMonthEnd = new Date('2026-06-30T23:30:00.000Z')

    expect(isValidReportMonth('2026-06', justAfterLondonMonthEnd)).toBe(true)
  })
})

describe('cutoffForReportMonth', () => {
  it('maps a BST month to 23:00 UTC on its last day', () => {
    expect(cutoffForReportMonth('2026-06').toISOString()).toBe(
      '2026-06-30T23:00:00.000Z'
    )
  })

  it('maps a GMT month to midnight UTC on the 1st of the following month', () => {
    expect(cutoffForReportMonth('2026-12').toISOString()).toBe(
      '2027-01-01T00:00:00.000Z'
    )
  })

  it('stays on GMT for the month ending before the spring clock change', () => {
    expect(cutoffForReportMonth('2026-02').toISOString()).toBe(
      '2026-03-01T00:00:00.000Z'
    )
  })

  it('uses BST for the month containing the spring clock change', () => {
    expect(cutoffForReportMonth('2026-03').toISOString()).toBe(
      '2026-03-31T23:00:00.000Z'
    )
  })

  it('uses BST for the month ending before the autumn clock change', () => {
    expect(cutoffForReportMonth('2026-09').toISOString()).toBe(
      '2026-09-30T23:00:00.000Z'
    )
  })

  it('returns to GMT for the month containing the autumn clock change', () => {
    expect(cutoffForReportMonth('2026-10').toISOString()).toBe(
      '2026-11-01T00:00:00.000Z'
    )
  })
})
