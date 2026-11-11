/**
 * @import { AccreditationStatus, AccreditationView, ExporterRegistrationView, ReprocessorRegistrationView } from '#server/common/helpers/fetch-organisation-view.js'
 */

/**
 * @param {string} accreditationNumber
 * @param {AccreditationStatus} [current]
 * @returns {AccreditationView}
 */
export const accreditationView = (
  accreditationNumber,
  current = 'approved'
) => ({
  accreditationNumber,
  status: { current }
})

/**
 * A reprocessor registration as the backend serves it in the organisation
 * view. Serve `accredited` for a year that holds an active accreditation, as
 * the backend does.
 * @param {Partial<ReprocessorRegistrationView>} [overrides]
 * @returns {ReprocessorRegistrationView}
 */
export const reprocessorView = (overrides = {}) => ({
  material: 'glass',
  status: { current: 'approved' },
  standingByDate: {},
  wasteProcessingType: 'reprocessor',
  reprocessingType: 'input',
  site: { address: { line1: 'Site A', town: 'Leeds', postcode: 'LS1 1AA' } },
  accreditations: {},
  ...overrides
})

/**
 * An exporter registration as the backend serves it in the organisation view.
 * @param {Partial<ExporterRegistrationView>} [overrides]
 * @returns {ExporterRegistrationView}
 */
export const exporterView = (overrides = {}) => ({
  material: 'glass',
  status: { current: 'approved' },
  standingByDate: {},
  wasteProcessingType: 'exporter',
  accreditations: {},
  ...overrides
})
