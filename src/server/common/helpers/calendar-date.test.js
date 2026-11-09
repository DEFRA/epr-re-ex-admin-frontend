import { utcCalendarDate } from './calendar-date.js'

describe('#utcCalendarDate', () => {
  test('gives the UTC date of an instant', () => {
    expect(utcCalendarDate(new Date('2026-06-30T23:30:00.000Z'))).toBe(
      '2026-06-30'
    )
  })

  test('gives the UTC date when the local date has already moved on', () => {
    expect(utcCalendarDate(new Date('2026-07-01T00:30:00.000+01:00'))).toBe(
      '2026-06-30'
    )
  })
})
