import { describe, expect, it } from 'vitest'

import { exportYears } from './export-years.js'

describe('exportYears', () => {
  it('offers 2026 alone during 2026', () => {
    expect(exportYears(new Date('2026-12-31T23:59:59Z'))).toEqual(['2026'])
  })

  it('offers every year from 2026 to the current one', () => {
    expect(exportYears(new Date('2028-01-01T00:00:00Z'))).toEqual([
      '2026',
      '2027',
      '2028'
    ])
  })
})
