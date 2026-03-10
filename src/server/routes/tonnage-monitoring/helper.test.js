import { describe, it, expect } from 'vitest'
import { buildMaterialRowData, uniqueMonthNames } from './helper.js'

describe('uniqueMonthNames', () => {
  it('should return empty array when no materials', () => {
    const result = uniqueMonthNames({ materials: [] })
    expect(result).toEqual([])
  })

  it('should return all unique month names present in chronological order', () => {
    const data = {
      materials: [
        { months: [{ month: 'Jan' }] },
        { months: [{ month: 'Jan' }, { month: 'Feb' }] }
      ]
    }
    const result = uniqueMonthNames(data)
    expect(result).toEqual(['Jan', 'Feb'])
  })

  it('should combine months from all materials and maintain chronological order even if data is shuffled', () => {
    const data = {
      materials: [
        { months: [{ month: 'Mar' }] },
        { months: [{ month: 'Jan' }, { month: 'Feb' }] }
      ]
    }

    const result = uniqueMonthNames(data)
    expect(result).toEqual(['Jan', 'Feb', 'Mar'])
  })
})

describe('buildMaterialRowData', () => {
  it('should return rows with materials, type totals, and year total', () => {
    const data = {
      materials: [
        {
          material: 'plastic',
          type: 'Reprocessor',
          year: 2026,
          months: [
            { month: 'Jan', tonnage: 100 },
            { month: 'Feb', tonnage: 200 }
          ]
        },
        {
          material: 'aluminium',
          type: 'Reprocessor',
          year: 2026,
          months: [
            { month: 'Jan', tonnage: 50 },
            { month: 'Feb', tonnage: 75 }
          ]
        },
        {
          material: 'plastic',
          type: 'Exporter',
          year: 2026,
          months: [
            { month: 'Jan', tonnage: 30 },
            { month: 'Feb', tonnage: 40 }
          ]
        }
      ]
    }

    const result = buildMaterialRowData(data)

    expect(result).toEqual({
      monthNames: ['Jan', 'Feb'],
      hasMultipleYears: false,
      rows: [
        {
          material: 'plastic',
          type: 'Reprocessor',
          year: 2026,
          monthValues: { Jan: 100, Feb: 200 }
        },
        {
          material: 'aluminium',
          type: 'Reprocessor',
          year: 2026,
          monthValues: { Jan: 50, Feb: 75 }
        },
        {
          type: 'Reprocessor',
          year: 2026,
          monthValues: { Jan: 150, Feb: 275 }
        },
        {
          material: 'plastic',
          type: 'Exporter',
          year: 2026,
          monthValues: { Jan: 30, Feb: 40 }
        },
        {
          type: 'Exporter',
          year: 2026,
          monthValues: { Jan: 30, Feb: 40 }
        },
        {
          year: 2026,
          monthValues: { Jan: 180, Feb: 315 }
        }
      ]
    })
  })

  it('should handle multiple years each with different months', () => {
    const data = {
      materials: [
        {
          material: 'plastic',
          type: 'Reprocessor',
          year: 2027,
          months: [{ month: 'Jan', tonnage: 100 }]
        },
        {
          material: 'plastic',
          type: 'Exporter',
          year: 2027,
          months: [{ month: 'Jan', tonnage: 50 }]
        },
        {
          material: 'aluminium',
          type: 'Reprocessor',
          year: 2026,
          months: [
            { month: 'Dec', tonnage: 25 },
            { month: 'Nov', tonnage: 25 }
          ]
        }
      ]
    }

    const result = buildMaterialRowData(data)

    expect(result).toEqual({
      hasMultipleYears: true,
      monthNames: ['Jan', 'Nov', 'Dec'],
      rows: [
        {
          material: 'plastic',
          monthValues: {
            Jan: 100
          },
          type: 'Reprocessor',
          year: 2027
        },
        {
          monthValues: {
            Jan: 100
          },
          type: 'Reprocessor',
          year: 2027
        },
        {
          material: 'plastic',
          monthValues: {
            Jan: 50
          },
          type: 'Exporter',
          year: 2027
        },
        {
          monthValues: {
            Jan: 50
          },
          type: 'Exporter',
          year: 2027
        },
        {
          monthValues: {
            Jan: 150
          },
          year: 2027
        },
        {
          material: 'aluminium',
          monthValues: {
            Nov: 25,
            Dec: 25
          },
          type: 'Reprocessor',
          year: 2026
        },
        {
          monthValues: {
            Nov: 25,
            Dec: 25
          },
          type: 'Reprocessor',
          year: 2026
        },
        {
          monthValues: {
            Nov: 25,
            Dec: 25
          },
          year: 2026
        }
      ]
    })
  })

  it('should handle empty materials array', () => {
    const data = { materials: [] }

    const result = buildMaterialRowData(data)

    expect(result.rows).toEqual([])
    expect(result.monthNames).toEqual([])
    expect(result.hasMultipleYears).toBe(false)
  })
})
