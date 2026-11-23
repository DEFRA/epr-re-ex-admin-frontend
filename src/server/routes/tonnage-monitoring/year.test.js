import { vi } from 'vitest'
import { defaultYear, tonnageMonitoringUrl } from './year.js'

describe('defaultYear', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2025-06-01') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('is the current year when the report can be shown for it', () => {
    expect(defaultYear(['2026', '2025', '2024'])).toBe('2025')
  })

  test('is the newest year when the report cannot be shown for the current one', () => {
    expect(defaultYear(['2024', '2023'])).toBe('2024')
  })
})

describe('tonnageMonitoringUrl', () => {
  test('names the year in the query', () => {
    expect(tonnageMonitoringUrl('2026')).toBe('/tonnage-monitoring?year=2026')
  })
})
