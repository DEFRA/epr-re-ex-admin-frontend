import { vi } from 'vitest'
import {
  defaultReportYear,
  reportUrlForYear,
  yearItems
} from './report-year.js'

describe('defaultReportYear', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2025-06-01') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('is the current year when the report can be shown for it', () => {
    expect(defaultReportYear(['2026', '2025', '2024'])).toBe('2025')
  })

  test('is the newest year when the report cannot be shown for the current one', () => {
    expect(defaultReportYear(['2024', '2023'])).toBe('2024')
  })
})

describe('reportUrlForYear', () => {
  test('names the year in the query', () => {
    expect(reportUrlForYear('/a-report', '2026')).toBe('/a-report?year=2026')
  })
})

describe('yearItems', () => {
  test('offers every year, with the one shown selected', () => {
    expect(yearItems({ years: ['2026', '2025'], year: '2025' })).toEqual([
      { value: '2026', text: '2026', selected: false },
      { value: '2025', text: '2025', selected: true }
    ])
  })
})
