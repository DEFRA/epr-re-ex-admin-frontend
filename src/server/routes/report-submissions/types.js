/**
 * Row in the report-submissions CSV download. Mirrors the shape returned
 * by `GET /v1/organisations/reports/submissions` on epr-backend.
 * @typedef {{
 *   accreditationNumber: string
 *   approvedPersonsEmail: string
 *   approvedPersonsPhone: string
 *   averagePrnPernPricePerTonne: string
 *   dueDate: string
 *   freeTonnagePrnsPerns: string
 *   material: string
 *   noteToRegulator: string
 *   organisationName: string
 *   registrationNumber: string
 *   regulator: string
 *   reportType: string
 *   reportingPeriod: string
 *   submittedBy: string
 *   submittedDate: string
 *   submitterEmail: string
 *   submitterPhone: string
 *   tonnageExportedForRecycling: string
 *   tonnageExportedThatWasRefused: string
 *   tonnageExportedThatWasStopped: string
 *   tonnagePrnsPernsIssued: string
 *   tonnageReceivedButNotExported: string
 *   tonnageReceivedButNotRecycled: string
 *   tonnageReceivedForRecycling: string
 *   tonnageRecycled: string
 *   tonnageRepatriated: string
 *   tonnageSentOnToExporter: string
 *   tonnageSentOnToOtherFacilities: string
 *   tonnageSentOnToReprocessor: string
 *   tonnageSentOnTotal: string
 *   totalRevenuePrnsPerns: string
 * }} ReportSubmissionsRow
 */

export {} // NOSONAR: javascript:S7787 - Required to make this file a module for JSDoc @import
