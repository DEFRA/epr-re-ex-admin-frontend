import {
  formatMonth,
  formatNumber,
  formatProcessingType,
  mapCreditedTonnageRow
} from './formatters.js'

describe('credited-tonnage formatters', () => {
  describe('formatMonth', () => {
    test('turns a YYYY-MM key into its display form', () => {
      expect(formatMonth('2026-01')).toBe('January 2026')
      expect(formatMonth('2026-12')).toBe('December 2026')
    })
  })

  describe('formatNumber', () => {
    test('formats with en-GB grouping and two decimal places', () => {
      expect(formatNumber(1000)).toBe('1,000.00')
      expect(formatNumber(25.5)).toBe('25.50')
      expect(formatNumber(0)).toBe('0.00')
    })
  })

  describe('formatProcessingType', () => {
    test('capitalises the processing type for display', () => {
      expect(formatProcessingType('reprocessor')).toBe('Reprocessor')
      expect(formatProcessingType('exporter')).toBe('Exporter')
    })
  })

  describe('mapCreditedTonnageRow', () => {
    test('maps an API row to a fully formatted table row', () => {
      const apiRow = {
        month: '2026-01',
        organisation: { id: '0000-0000-uuid', reference: '500001' },
        accreditation: {
          id: '1111-1111-uuid',
          accreditationNumber: 'ACC-456',
          processingType: 'reprocessor',
          material: 'plastic'
        },
        tonnage: {
          totalCredited: 1000,
          eligibleForWasteBalance: 900,
          sentOnDeductions: 50
        }
      }

      expect(mapCreditedTonnageRow(apiRow)).toEqual({
        month: 'January 2026',
        organisationId: '500001',
        accreditationNumber: 'ACC-456',
        material: 'Plastic',
        type: 'Reprocessor',
        totalCredited: '1,000.00',
        eligibleForWasteBalance: '900.00',
        sentOnDeductions: '50.00'
      })
    })

    test('uses the organisation reference, not the internal id', () => {
      const apiRow = {
        month: '2026-03',
        organisation: { id: 'internal-uuid', reference: '500042' },
        accreditation: {
          id: 'acc-uuid',
          accreditationNumber: 'ACC-789',
          processingType: 'exporter',
          material: 'glass_re_melt'
        },
        tonnage: {
          totalCredited: 12.5,
          eligibleForWasteBalance: 12.5,
          sentOnDeductions: 0
        }
      }

      const row = mapCreditedTonnageRow(apiRow)

      expect(row.organisationId).toBe('500042')
      expect(row.material).toBe('Glass re-melt')
      expect(row.type).toBe('Exporter')
      expect(row.sentOnDeductions).toBe('0.00')
    })
  })
})
